#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import prompts from 'prompts';
import { Octokit as OriginalOctokit } from '@octokit/rest';
import { throttling } from '@octokit/plugin-throttling';

const Octokit = OriginalOctokit.plugin(throttling);

const throttle = {
  onRateLimit: (retryAfter: number, options: any, octokit: any) => {
    octokit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`);

    if (options.request.retryCount === 10) {
      // only retries once
      octokit.log.info(`Retrying after ${retryAfter} seconds!`);
      return true;
    }
  },
  onAbuseLimit: (retryAfter: number, options: any, octokit: any) => {
    // does not retry, only logs a warning
    octokit.log.warn(`Abuse detected for request ${options.method} ${options.url}`);
  },
};

(async () => {
  const { auth, matcher } = await prompts([
    {
      type: 'text',
      name: 'auth',
      message:
        'Github API Key. You can generate the token at https://github.com/settings/tokens/new. ' +
        'The token needs the `notification` and `repo` permissions. Make sure the token has access to the organizations, whose ' +
        'repos you want to unwatch, which might require you to enable SSO for that organization.',
    },
    {
      type: 'text',
      name: 'matcher',
      message:
        'Provide a regex that matches the repos that you want to unsubscribe. ' +
        'Repos are named `organization/repo-name`. You will be able to review the list ' +
        'of matched repos before they are unwatched. You can for example use the input "^github/" ' +
        'to unsubscribe from all repos within the Github organization.',
    },
  ]);

  console.log('Fetching your watched repos from Github...');

  const octokit = new Octokit({ auth, throttle });
  const watchedRepos: string[] = await octokit.paginate('GET /user/subscriptions', response =>
    response.data.map(repo => repo.full_name)
  );

  const matcherRegex = new RegExp(matcher);
  const matchedRepos = watchedRepos.filter(repo => matcherRegex.test(repo));

  console.log(
    `You are currently watching ${watchedRepos.length} repos, from which the following ${matchedRepos.length} ` +
      `repos match your regex: ${matchedRepos.join(', ')}`
  );

  let unsubscribeRepos: string[] = [];

  const { reviewRepos } = await prompts([
    {
      type: 'select',
      name: 'reviewRepos',
      message: `Do you want to unsubscribe from all of them, or review your selection?`,
      choices: [
        { value: false, title: 'Unsubscribe from all' },
        { value: true, title: 'Review my selection' },
      ],
    },
  ]);

  if (reviewRepos) {
    const { unsubscribeReposSelection } = await prompts([
      {
        type: 'multiselect',
        name: 'unsubscribeReposSelection',
        message:
          `You are currently watching ${watchedRepos.length} repos, ${matchedRepos.length} of which match your regex. ` +
          'Choose which of those repositories you want to unsubscribe to.',
        choices: matchedRepos.map(repo => ({ title: repo, value: repo, selected: true })),
      },
    ]);
    unsubscribeRepos = unsubscribeReposSelection;
  } else {
    unsubscribeRepos = matchedRepos;
  }

  console.log(`You've selected the following ${unsubscribeRepos.length} repos: ${unsubscribeRepos.join(', ')}`);

  const { confirmation } = await prompts([
    {
      type: 'confirm',
      name: 'confirmation',
      message:
        `Are you sure you want to unsubscribe from the ${unsubscribeRepos.length} repositories listed above? ` +
        'This is the final confirmation, after this the repositories will be unwatched. There is no undo!',
    },
  ]);

  if (confirmation) {
    const failedRepos: string[] = [];
    console.log('Unwatching repositories...');

    for (const fullRepo of unsubscribeRepos) {
      const [owner, repo] = fullRepo.split('/');
      try {
        await octokit.activity.deleteRepoSubscription({ owner, repo });
        console.log(`Unwatched ${fullRepo}`);
        await new Promise(r => setTimeout(r, 300));
      } catch (e) {
        console.log(`Failed to unwatch ${fullRepo}`);
        failedRepos.push(fullRepo);
      }
    }

    if (failedRepos.length > 0) {
      for (const repo of failedRepos) {
        console.log(`${failedRepos} was not unwatched.`);
      }

      console.log(
        `Unwatched ${unsubscribeRepos.length - failedRepos.length}, ${failedRepos.length} ` +
          'repos failed to be unwatched. This may have been caused by API limits. You can try the process ' +
          'with the same matcher to unwatch from the remaining repos.'
      );
    } else {
      console.log(`Successfully unwatched ${unsubscribeRepos.length} repositories`);
    }
  } else {
    console.log('Aborted. Your watched repositories were not changed.');
  }
})();
