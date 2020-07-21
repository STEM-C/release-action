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
        let isRelease = pr.title.match(/release/gi);
        if (isRelease) {
            let version = pr.title.match(/(?:v\s?)(\d+.?)+/gi)[0];

            await postTag(version);

        }  else {
            console.log("This was a merge to master which was not a release, attempting to increment patch version.");
            let stdout = "";
            let stderr = "";
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

            const branch = await exec("git branch", undefined, options);
            console.log("The branch is: ", branch);
            console.log("The branch stdout is: ", stdout);
            console.log("The branch stderr is: ", stderr);

            const previousTagSha = await exec("git rev-list --tags --topo-order --max-count=1");


            console.log("Value of previous tag is: ", previousTagSha);
            let tag = await exec(`git describe --tags ${previousTagSha}`);
            console.log("Value of last tag is: ", tag);

            let regTag = tag.match(/(?:v)(\d+.\d+).?(\d+)?/i);
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
    console.log(`Creating annotated tag`);

    const tagCreateResponse = await client.git.createTag({
        ...context.repo,
        tag: ver,
        message: pr.body,
        object: context.sha,
        type: "commit",
    });

    console.log(`Pushing annotated tag to the repo`);

    let response = await client.git.createRef({
        ...context.repo,
        ref: `refs/tags/${ver}`,
        sha: tagCreateResponse.data.sha,
    });

    console.log("Tag should be created, response was: \n\n", response);
}