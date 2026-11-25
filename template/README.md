# My Cards

Brainstorming cards. Arrange, think, discuss.

This repository holds **content only**. Everything that displays the cards comes from the [cardsimulator](https://github.com/csongorb/cardsimulator) submodule.

## Structure

This repository holds **content only**. Everything that displays the cards comes from [cardsimulator](https://github.com/csongorb/cardsimulator), included as a git submodule (pinned to a commit).

- `cards/cardset.xml`: title, repository and public address (used by the QR codes in PDFs)
- `cards/cardCategories.xml`, `cards/cards.xml`: the cards
- `texts/`: documents linked from the cards
- `index.html`: tiny loader, identical in every card set
- `.github/workflows/deploy.yml`: publishes the site to GitHub Pages on every push to `main`
- `.github/workflows/update-cardsimulator.yml`: manual run (workflow_dispatch) that bumps the `cardsimulator` submodule to the newest commit on `main` and pushes the pointer to `main`
- `cardsimulator/`: the simulator (submodule)

Run locally with any static web server (the XML can't be loaded from `file://`).

Update the simulator: run the *Update cardsimulator submodule* workflow on GitHub Actions, or locally with the help of your Git client.

## Changelog

## Credits

## License
