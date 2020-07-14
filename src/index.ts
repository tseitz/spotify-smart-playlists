import { smartPlaylists, SmartPlaylist } from './data/smartPlaylists'
import { Spotify } from './models/Spotify'

interface MappedTrack {
  name: string
  href: string
  uri: string
}

interface MappedPlaylist {
  name: string
  playlistId: string
  tracks: MappedTrack[]
}

const spotify = new Spotify({
  id: process.env.SPOTIFY_CLIENT_ID,
  secret: process.env.SPOTIFY_CLIENT_SECRET,
})

async function run() {
  // grab all playlists
  const allPlaylists: any[] = await spotify.getAllMyPlaylists()

  // create unique list of playlists to grab from spotify. First time using flatMap!
  const analyzePlaylists = Array.from(
    new Set(smartPlaylists.flatMap(smart => [smart.source, smart.check]))
  )

  // filter out the ones we don't care about
  // TODO: Could be better, create list based on input file. IE Banger, DnB and Not
  const filteredPlaylists = allPlaylists.filter(
    playlist =>
      analyzePlaylists.some(name => playlist.name.startsWith(name)) &&
      playlist.name !== 'Festival Test'
  )

  // grab all tracks for the playlist and reduce them to the items we care about
  const mapped: Promise<MappedPlaylist>[] = await filteredPlaylists.map(
    async (playlist): Promise<MappedPlaylist> => {
      const mappedPlaylist: MappedPlaylist = {
        name: playlist.name,
        playlistId: playlist.id,
        tracks: [],
      }

      const items = await spotify.getAllPlaylistTracks(playlist.tracks.href)
      mappedPlaylist.tracks = trackReducer(items)

      return mappedPlaylist
    }
  )

  // once we grab all the tracks, lets categorize them
  Promise.all(mapped).then(mappedPlaylists => {
    smartPlaylists.forEach(smartPlaylist => {
      smartify(mappedPlaylists, smartPlaylist)
    })
  })
}

function trackReducer(tracks: any[]): MappedTrack[] {
  return tracks.map(track => {
    return {
      name: track.track.name,
      href: track.track.href,
      uri: track.track.uri,
    }
  })
}

function smartify(
  allPlaylists: MappedPlaylist[],
  { source, check, notPlaylist }: SmartPlaylist
) {
  const destination = `${source}${notPlaylist ? ' Not ' : ' '}${check}`

  const sourcePlaylist = allPlaylists.filter(
    playlist => playlist.name === source
  )[0]
  const destinationPlaylist = allPlaylists.filter(
    playlist => playlist.name === destination
  )[0]
  const checkPlaylist = allPlaylists.filter(
    playlist => playlist.name === check
  )[0]

  const weirdPlaylist = allPlaylists.filter(
    playlist => playlist.name === 'Weird'
  )[0]

  console.log('Check:', check, checkPlaylist.tracks.length)
  console.log('Source:', source, sourcePlaylist.tracks.length)
  console.log('Destination:', destination, destinationPlaylist.tracks.length)

  // URI's to add and remove
  const addTracks: string[] = []
  const removeTracks: string[] = []

  const checkUris = checkPlaylist.tracks.map(track => track.uri)
  const sourceUris = sourcePlaylist.tracks.map(track => track.uri)
  const destinationUris = destinationPlaylist.tracks.map(track => track.uri)
  const weirdUris = destinationPlaylist.tracks.map(track => track.uri)

  // Add Tracks
  sourcePlaylist.tracks.forEach(track => {
    // Add to Bangers Heavy if in Bangers & Heavy
    if (
      !notPlaylist &&
      checkUris.includes(track.uri) &&
      !destinationUris.includes(track.uri)
    )
      addTracks.push(track.uri)

    // Add to Festival Not Heavy if in Festival & not in Heavy
    if (
      notPlaylist &&
      !checkUris.includes(track.uri) &&
      !destinationUris.includes(track.uri)
    )
      addTracks.push(track.uri)
  })
  console.log('Tracks to Add:', addTracks.length)
  const removeLocal = addTracks.filter(track => !track.includes('local'))
  console.log(removeLocal) // TODO: bug, remove
  spotify.postPlaylistTracks(destinationPlaylist.playlistId, removeLocal)
  // spotify.postPlaylistTracks(destinationPlaylist.playlistId, addTracks)

  // Remove Tracks
  destinationUris.forEach(uri => {
    // If in Banger Heavy, but not Heavy or Banger, remove it
    if (!notPlaylist && (!checkUris.includes(uri) || !sourceUris.includes(uri)))
      removeTracks.push(uri)

    // If in Festival Not Heavy, but it's not in Festival or in it's in Heavy, remove it
    if (
      notPlaylist &&
      (checkUris.includes(uri) || !sourceUris.includes(uri)) &&
      !weirdUris.includes(uri)
    )
      removeTracks.push(uri)
  })
  console.log(
    "Tracks to Remove (technically we're adding right now):",
    removeTracks.length
  )
  // spotify.removePlaylistTracks(destinationPlaylist.playlistId, removeTracks)
  // spotify.postPlaylistTracks(checkPlaylist.playlistId, removeTracks)
  const removeLocal2 = removeTracks.filter(track => !track.includes('local'))
  console.log(removeLocal2) // TODO: bug, remove
  spotify.postPlaylistTracks(checkPlaylist.playlistId, removeLocal2)

  // Logging Porpoises
  const addTrackDetails = sourcePlaylist.tracks.filter(track =>
    // removeLocal.includes(track.uri)
    addTracks.includes(track.uri)
  )
  console.log(addTrackDetails)
  const removeTrackDetails = destinationPlaylist.tracks.filter(track =>
    removeTracks.includes(track.uri)
  )
  console.log(removeTrackDetails)
}

run()
