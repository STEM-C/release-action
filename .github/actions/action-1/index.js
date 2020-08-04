const core = require("@actions/core");
const { exec } = require("@actions/exec");
const { context, GitHub } = require("@actions/github");
const { request } = require("@octokit/request");

const pr = context.payload.pull_request;
const client = new GitHub(core.getInput("repo_token"));
//const slackToken = core.getInput("slack_token");

run();

async function run() {
    // verify the pull request was merged
    if(!pr.merged) {
        console.log("Closed pr onto master was not merged, aborting action");
        return;
    }

    try {
        let isRelease = pr.head.ref.match(/release/gi);
        if (isRelease) {
            let version = pr.head.ref.match(/(?:v\s?)(\d+.?)+/gi)[0];

            await postTag(version);

        }  else {
            console.log("This was a merge to master which was not a release, attempting to increment patch version.");

            await _exec("git fetch --prune --unshallow --tags");
            const previousTagSha = (await _exec("git rev-list --tags --topo-order --max-count=1")).stdout.trim();
            let tag = (await _exec(`git describe --tags ${previousTagSha}`)).stdout.trim();

            let regTag = tag.match(/(\d+.\d+).?(\d+)?/i);
            let newVersion;

            if(regTag[2]) {
                let newPatch = parseInt(regTag[2], 10) + 1;
                newVersion = regTag[1] + "." + newPatch.toString()
            } else {
                newVersion = regTag[1] + ".1";
            }

            await postTag(newVersion);
        }
    } catch (error) {
        core.warning(error.message);
    }
}

async function postTag(ver) {
    console.log(`Creating annotated release`);

    const tagCreateResponse = await client.repos.createRelease({
        ...context.repo,
        tag_name: ver,
        name: ver,
        body: pr.body,
        draft: false,
        prerelease: false,
        target_commitish: context.sha,
    });

    console.log("Tag should be created, response was: \n\n", response);
}

async function _exec(command) {
    let stdout = "";
    let stderr = "";

    try {
        const options = {
            listeners: {
                stdout: (data) => {
                    stdout += data.toString();
                },
                stderr: (data) => {
                    stderr += data.toString();
                },
            },
        };

        const code = await exec(command, undefined, options);

        return {
            code,
            stdout,
            stderr,
        };
    } catch (err) {
        return {
            code: 1,
            stdout,
            stderr,
            error: err,
        };
    }
}
