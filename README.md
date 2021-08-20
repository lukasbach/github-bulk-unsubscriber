# github-bulk-unsubscriber

![Pretty](https://github.com/lukasbach/github-bulk-unsubscriber/workflows/Pretty/badge.svg)
![Publish](https://github.com/lukasbach/github-bulk-unsubscriber/workflows/Publish/badge.svg)

> Unsubscribe from large quantities of Github repositories in an instance. Specify the repos to unwatch with a Regex.

When you join an organization in Github, you automatically start watching all repositories that you gain
access to (unless previously disabled in your settings). For large organizations, this can make you watch
hundreds or thousands of repositories, making your Github notification overview pretty much useless, when
you start receiving notifications every couple of seconds for repositories you don't actually work on.

This tool allows you to unwatch large numbers of repositories by specifying a regex that matches the repositories
to unwatch. The tool will allow you to finetune your selection afterwards, and carefully ask you to review
your selection before the selected repositories are unsubscribed from.

You will need a Github Access token to use the tool. You can generate the token at https://github.com/settings/tokens/new.
The token needs the `notification` and `repo` permission. Make sure the token has access to the organizations, whose
repos you want to unwatch, which might require you to enable SSO for that organization.

![alt text](https://github.com/lukasbach/github-bulk-unsubscriber/ 'Demo Image')

## How to use

Run

    npx github-bulk-unsubscriber

in your terminal to start the interactive unsubscription process. You need NodeJS installed.

You can also [download a prebuilt binary](https://github.com/lukasbach/cli-ts-commander-starter/releases) and run that.

## How to develop

- `yarn` to install dependencies
- `yarn start` to run the CLI script for debugging
- `yarn test` to run tests
- `yarn prettier:check` to verify that your code is pretty
- `yarn prettier:write` to make your code pretty

Don't manually publish the package to NPM! You can just tag
a commit with a new release tag (remember to bump the version
in `package.json`) and push the changes, a Github Action
will deploy the new version to NPM.
