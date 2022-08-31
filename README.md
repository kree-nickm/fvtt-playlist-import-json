# Playlist Import JSON
Allows you to import and export playlists in JSON format.

The Playlists tab will now have two extra buttons at the bottom.
- Export Playlists - This will allow you to save your current playlists to your comupter in a JSON file.
- Import Playlists - This will ask you to select a JSON file from your computer containing your playlists, and then load them all into your Foundry game.

The format of the playlists JSON file can of course be the same as what this module exports, but you can also import playlists that were exported from Roll20.

Keep in mind that your Foundry server can't play files from someone else's Foundry installation or files that are stored on Roll20, so you would have to have used links to externally-stored sound files in your playlists. If you use a module that lets your stream songs from various websites, this will probably work with them, so long as they store the links to those streams the same way that Foundry stores any other playlist sound link.

If a playlist you import has the same name as a playlist that you already have in your game, then one of two things will happen:
- If the existing playlist was previously imported using this module, it will be completely overwritten. Songs in the old version of the playlist, but not the new version, will be deleted.
- If the existing playlist was not imported by this module, then the new one will be ignored entirely.

In future versions of this module, I may considering allowing you to customize what happens when playlists might be overwritten.

## Installation
In the Foundry VTT module manager, click the Install Module button and paste this URL into the Manifest URL box, then click Install: `https://raw.githubusercontent.com/kree-nickm/fvtt-playlist-import-json/main/module.json`

## Compatibility
This shouldn't conflict with any other modules. If Foundry revamps the way playlists work in a future update, that would likely break this module.

As usual with my modules, if this module breaks due to a Foundry update, I will not fix it until I update to the latest version of Foundry in my own games, which I will not do until most of the other modules I use have been confirmed to work on the new version of Foundry.
