# Jekyll with Google's Material Design Lite blog template

## How to use

- Initialize MDL submodule `git submodule update --remote`
- Install node packages `npm install`
- Make sure you have gulp installed globally `npm install gulp -g`
- Change the configurations and create your posts
- Run the default gulp task `gulp`
- Your site content with MDL will be at `dist/` directory.

## How it works

The default gulp task first run jekyll to build the site at `_site/`.
Then it builds MDL using `dist/` as destination.

## TODO

- Add a live reload task to ease development
