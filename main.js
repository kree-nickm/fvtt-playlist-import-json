"use strict";

Hooks.on('renderPlaylistDirectory', (app, html, data) => {
  if(game.user?.isGM || game.user?.can('SETTINGS_MODIFY'))
  {
    html.find('.directory-footer')[0].style.display = 'inherit';
    let container = $(`<div class="footer-actions action-buttons flexrow"></div>`);
    let importButton = $(`<button class="import-json"><i class="fas fa-file-import"></i>Import Playlists</button>`);
    let exportButton = $(`<button class="export-json"><i class="fas fa-file-export"></i>Export Playlists</button>`);
    container.append(importButton);
    container.append(exportButton);
    html.find('.directory-footer').append(container);
    importButton.on('click', PIJ.openImportDialog);
    exportButton.on('click', PIJ.exportData);
  }
});

let PIJ = {
  // This is based on ClientDocumentMixin.exportToJSON()
  exportData: function(event) {
    let allData = {
      exportSource: {
        world: game.world.id,
        system: game.system.id,
        coreVersion: game.version,
        systemVersion: game.system.data.version,
        module: "playlist-import-json",
        moduleVersion: game.modules.get('playlist-import-json').data.version,
      },
      playlists: [],
    };
    for(let playlist of game.playlists)
      allData.playlists.push(playlist.toCompendium(null));
    saveDataToFile(JSON.stringify(allData, null, 2), "text/json", `fvtt-exported-playlists.json`);
  },
  
  openImportDialog: async function(event) {
    new Dialog({
      title: `Playlist Import JSON`,
      content: await renderTemplate("templates/apps/import-data.html",
        {
          hint1: `Select a JSON file from your computer to use as the playlist data to import.`,
          hint2: `Compatible with JSON files exported from this Foundry module or Roll20.`,
        }),
      buttons: {
        import: {
          icon: '<i class="fas fa-file-import"></i>',
          label: "Import",
          callback: PIJ.importJSON
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      default: "import"
    }, {
      width: 400
    }).render(true);
  },
  
  // This is mostly a copy of ClientDocumentMixin.importFromJSON()
  importJSON: function(html) {
    let form = html.find("form")[0];
    if ( !form.data.files.length ) return ui.notifications.error("You did not upload a data file!");
    readTextFromFile(form.data.files[0]).then(PIJ.parseJSON);
  },
  
  parseJSON: async function(json) {
    let data = JSON.parse(json);
    let fromRoll20 = (data.schema_version!==undefined);
    let playlistCount = 0;
    for(let playlistData of data.playlists)
    {
      try
      {
        let playlist = await PIJ.createPlaylist(playlistData, fromRoll20, data.exportSource);
        if(fromRoll20)
        {
          for(let sound of playlistData.songs)
          {
            await playlist.createEmbeddedDocuments(
              'PlaylistSound',
              [{
                name: sound.title,
                path: sound.track_id,
                repeat: sound.loop,
                volume: sound.volume/100,
                playing: sound.playing,
                //fade: sound.softstop, // idk how either of these work
              }],
              {},
            );
          }
        }
        playlistCount++;
      }
      catch(err)
      {
        if(typeof(err) == "string")
          ui.notifications.error(err);
        else
          ui.notifications.error("An exception occurred while importing playlists. Check the console.");
        console.error(err);
      }
    }
    ui.notifications.info(`${playlistCount} playlists imported.`);
  },
  
  createPlaylist: function(playlistData, fromRoll20, exportSource) {
    return new Promise(async (resolve, reject) => {
      let playlist = game.playlists?.contents.find((p) => p.name === playlistData.name);
      if(playlist)
      {
        if(playlist.getFlag('playlist-import-json', 'isImported'))
          await playlist.delete();
        else
        {
          reject(`Refused to import playlist "${playlistData.name}," because a playlist by that name already exists, which was not imported by this module.`);
          return;
        }
      }
      try {
        playlist = await Playlist.create({
          name: playlistData.name,
          mode: fromRoll20 ? PIJ.roll20Conv.mode[playlistData.mode] : playlistData.mode,
          playing: false,
        });
        if(!fromRoll20 && exportSource)
          await PIJ.reimportPlaylist(playlist, playlistData, exportSource);
        await playlist?.setFlag('playlist-import-json', 'isImported', true);
        resolve(playlist);
      } catch (error) {
        reject(error);
      }
    });
  },
  
  // This is based on ClientDocumentMixin.importFromJSON()
  reimportPlaylist: function(playlist, playlistData, exportSource) {
    playlistData._id = playlist.id;
    playlistData = playlist.collection.fromCompendium(playlistData, {addFlags: false, keepId: true});
    let d = new playlist.constructor.schema(playlistData);

    // Preserve certain fields
    let {folder, sort, permission} = playlist.data;
    playlist.data.update(foundry.utils.mergeObject(d.toObject(), {folder, sort, permission}), {recursive: false});
    return playlist.update(playlist.toObject(), {diff: false, recursive: false}).then(doc => {
      return doc;
    });
  },
  
  roll20Conv: {
    mode: {
      s: CONST.PLAYLIST_MODES.SHUFFLE,
    },
  },
};
