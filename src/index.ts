import fetch from 'node-fetch'
import { smartPlaylists, SmartPlaylist } from '../data/smartPlaylists'

const TOKEN_URI = 'https://accounts.spotify.com/api/token'
const BASE_URI = 'https://api.spotify.com/v1'
const MY_PLAYLIST_URL = `${BASE_URI}/me/playlists`
const TOKEN =
  'BQDanxqxW19dgulNl0tcSMk-9uY2zRasHq7EGZoDZpQ4E4ovJtDS_KtOWC61OodjDGlsS5O-69H6bgFt_u00nVqYvOkoUn_hH83eyJmfgi5lcBHEi9S8lmmwEX-NHJaGbyJU7F3mnVHTKtLXkWgKBgGqaHFyMSNfAiLAm5eSUelbqR5wh2T3KZfA4-pIwJkHXWlysMPiylPI2CnLTiIsB4RxC_DFgFiGVdCBQto'

interface Credentials {
  id?: string
  secret?: string
}
interface Token {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

class Spotify {
  credentials: Credentials
  token: Token

  constructor(credentials: Credentials) {
    if (!credentials || !credentials.id || !credentials.secret) {
      throw new Error(
        'Please supply an object containing your Spotify client "id" and "secret".'
      )
    }
    this.credentials = { id: credentials.id, secret: credentials.secret }
    this.token
  }

  async setToken() {
    const auth = Buffer.from(
      `${this.credentials.id}:${this.credentials.secret}`
    ).toString('base64')

    const opts = {
      method: 'POST',
      body: 'grant_type=client_credentials',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
    }
    try {
      const res = await fetch(TOKEN_URI, opts)

      if (res.status !== 200) throw res

      this.token = await res.json()
    } catch (err) {
      err.text().then((text: string) => console.log('Fetch Error:\n', text))
    }
  }

  // isTokenExpired() {
  //   if (this.token) {
  //     if (Date.now() / 1000 >= this.token.expires_at - 300) {
  //       return true
  //     }
  //   }
  //   return false
  // }

  async getPlaylists() {
    const URI = `${BASE_URI}/me/playlists`
    const opts: any = { method: 'GET' }

    // if (!this.token || !this.token.access_token) {
    //   // || !this.isTokenExpired())
    //   this.setToken().then(async () => {
    //     opts.headers = this.getTokenHeader()
    //     const res = await fetch(URI, opts)
    //     const body = await res.json()
    //     console.log(body)
    //   })
    // } else {
    opts.headers = this.getTokenHeader()
    const res = await fetch(URI, opts)
    return await res.json()
  }

  async getAllPlaylists(href: string) {
    const opts: any = { method: 'GET' }
    opts.headers = this.getTokenHeader()

    const res = await fetch(href, opts)
    const playlists = await res.json()

    // Fancy smanshy recursion
    if (playlists.next) {
      return playlists.items.concat(
        await this.getAllPlaylistTracks(playlists.next)
      )
    } else {
      return playlists.items
    }
  }

  async getPlaylistTracks(href: string) {
    const opts: any = { method: 'GET' }
    opts.headers = this.getTokenHeader()
    const res = await fetch(href, opts)
    return await res.json()
  }

  async getAllPlaylistTracks(href: string) {
    const opts: any = { method: 'GET' }
    opts.headers = this.getTokenHeader()

    const res = await fetch(href, opts)
    const tracks = await res.json()

    // Fancy smanshy recursion
    if (tracks.next) {
      return tracks.items.concat(await this.getAllPlaylistTracks(tracks.next))
    } else {
      return tracks.items
    }
  }

  async postPlaylistTracks(id: string, uris: string[]) {
    const opts: any = { method: 'POST', body: JSON.stringify({ uris }) }
    console.log(opts.body)
    opts.headers = this.getPostHeader()
    const URI = `${BASE_URI}/playlists/${id}/tracks`

    // TODO: Check if over 100 items
    const res = await fetch(URI, opts)
    const ress = await res.json()
    console.log(ress)
    return ress
  }

  getTokenHeader() {
    // if (!this.token || !this.token.access_token) {
    //   throw new Error(
    //     "An error has occurred. Make sure you're using a valid client id and secret.'"
    //   )
    // }
    return {
      Authorization: `Bearer ${TOKEN}`,
    }
  }

  getPostHeader() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    }
  }
}

const spotify = new Spotify({
  id: process.env.SPOTIFY_CLIENT_ID,
  secret: process.env.SPOTIFY_CLIENT_SECRET,
})

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

async function run() {
  const allPlaylists = await spotify.getAllPlaylists(MY_PLAYLIST_URL)

  // create unique list of playlists to grab from spotify
  const analyzePlaylists = Array.from(
    new Set(smartPlaylists.flatMap((smart) => [smart.source, smart.check]))
  )

  // filter out the ones we don't care about
  // TODO: Could be better, create list based on input file. IE Banger, DnB and Not
  const filteredPlaylists = allPlaylists.filter(
    (playlist) =>
      analyzePlaylists.some((name) => playlist.name.startsWith(name)) &&
      playlist.name !== 'Festival Test'
  )

  const mapped: MappedPlaylist[] = await filteredPlaylists.map(
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
  Promise.all(mapped).then((mappedPlaylists) => {
    smartPlaylists.forEach((smartPlaylist) => {
      smartify(mappedPlaylists, smartPlaylist)
    })
  })
}

function trackReducer(tracks: any[]): MappedTrack[] {
  return tracks.map((track) => {
    return {
      name: track.track.name,
      href: track.track.href,
      uri: track.track.uri,
    }
  })
}

function smartify(
  allPlaylists: MappedPlaylist[],
  { source, check, notPlaylist }: SmartPlaylist // notPlaylist = Festival Not Heavy, Bangers Not Heavy (essentially do the opposite)
) {
  const destination = `${source}${notPlaylist ? ' Not ' : ' '}${check}`
  console.log(destination)
  const sourcePlaylist = allPlaylists.filter(
    (playlist) => playlist.name === source
  )[0]
  const destinationPlaylist = allPlaylists.filter(
    (playlist) => playlist.name === destination
  )[0]
  const checkPlaylist = allPlaylists.filter(
    (playlist) => playlist.name === check
  )[0]
  // URI's to add and remove
  const addTracks: string[] = []
  const removeTracks: string[] = []

  const checkUris = checkPlaylist.tracks.map((track) => track.uri)
  const destinationUris = destinationPlaylist.tracks.map((track) => track.uri)

  if (notPlaylist) {
    // IE if Festival (source) is not in heavy and not in Festival Not Heavy, add to destination
    sourcePlaylist.tracks.forEach((track) => {
      if (
        !checkUris.includes(track.uri) &&
        !destinationUris.includes(track.uri)
      ) {
        addTracks.push(track.uri)
      }
    })
  } else {
    // IE if Bangers in heavy and not in Bangers Heavy, add to destination
    sourcePlaylist.tracks.forEach((track) => {
      if (
        checkUris.includes(track.uri) &&
        !destinationUris.includes(track.uri)
      ) {
        addTracks.push(track.uri)
      }
    })
  }
  console.log(addTracks.length)
  // spotify.postPlaylistTracks(destinationPlaylist.playlistId, addTracks)

  // Now check removals
  // { source: 'Banger', check: 'DnB', notPlaylist: false },
  // if (notPlaylist) {
  //   checkUris.forEach((uri) => {
  //     if (notPlaylist && !destinationUris.includes(uri)) {
  //       // If not in Heavy, but in Banger Heavy, remove from Banger Heavy
  //       removeTracks.push(uri)
  //     } else if (!notPlaylist && destinationUris.includes(uri)) {
  //       // If in heavy, and in Festival Not Heavy, remove from Festival Not Heavy
  //       removeTracks.push(uri)
  //     }
  //   })
  // } else {
  // if in Festival Not Heavy (destination) but not Heavy (check) remove
  // If in Banger DnB (destination) but not DnB (check) remove
  destinationUris.forEach((uri) => {
    if (!checkUris.includes(uri)) {
      // removeTracks.push(uri)
      addTracks.push(uri)
    }
  })
  // }
  console.log(removeTracks.length)
  console.log(
    destinationPlaylist.tracks.filter((playlist) =>
      addTracks.includes(playlist.uri)
    )
  )
  // spotify.postPlaylistTracks(checkPlaylist.playlistId, addTracks)
  // spotify.removePlaylistTracks(destinationPlaylist.playlistId, removeTracks)
}

run()
