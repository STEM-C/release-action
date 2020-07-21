const core = require("@actions/core");
const github = require("@actions/github");
const { request } = require("@octokit/request");

const pr = github.context.payload.pull_request;
const client = new github.GitHub(core.getInput("repoToken"));
const slackToken = core.getInput("slack_token");
const { GITHUB_REF, GITHUB_SHA } = process.env;

async function run() {
    // verify the pull request was merged
    if(!pr.merged) {
        console.log("Closed pr onto master was not merged, aborting action");
    }

    core.debug("Pushing pull request to test sha values: \n\n");
    console.log(pr);

    // try {
    //
    //     let isRelease = pr.title.match(/release/gi);
    //     if (isRelease) {
    //         let version = pr.match(/(?:v\s?)(\d+.?)+/gi)[0];
    //         let amendedVersion = "v" + version;
    //         core.debug(`Creating annotated tag`);
    //
    //         const tagCreateResponse = await client.git.createTag({
    //             ...github.context.repo,
    //             tag: amendedVersion,
    //             message: pr.body,
    //             object: GITHUB_SHA,
    //             type: "commit",
    //         });
    //
    //         core.debug(`Pushing annotated tag to the repo`);
    //
    //         await octokit.git.createRef({
    //             ...context.repo,
    //             ref: `refs/tags/${newTag}`,
    //             sha: tagCreateResponse.data.sha,
    //         });
    //
    //     }  else {
    //         console.log("This was a push to master which was not a release, attempting to increment patch version.");
    //     }
    // } catch (error) {
    //     core.warning(error.message);
    // }
}

run();