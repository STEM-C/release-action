const core = require("@actions/core");
const { context, GitHub } = require("@actions/github");
const { request } = require("@octokit/request");

const pr = context.payload.pull_request;
const client = new GitHub(core.getInput("repo_token"));
//const slackToken = core.getInput("slack_token");

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
            let amendedVersion = "v" + version;
            console.log(`Creating annotated tag`);

            const tagCreateResponse = await client.git.createTag({
                ...context.repo,
                tag: amendedVersion,
                message: pr.body,
                object: context.sha,
                type: "commit",
            });

            console.log(`Pushing annotated tag to the repo`);

            let response = await client.git.createRef({
                ...context.repo,
                ref: `refs/tags/${amendedVersion}`,
                sha: tagCreateResponse.data.sha,
            });

            console.log("Tag should be created, response was: \n\n", response);
        }  else {
            console.log("This was a push to master which was not a release, attempting to increment patch version.");
        }
    } catch (error) {
        core.warning(error.message);
    }
}

run();