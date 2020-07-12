import fetch from 'node-fetch'

const TOKEN_URI = 'https://accounts.spotify.com/api/token'
const BASE_URI = 'https://api.spotify.com/v1'
const MY_PLAYLIST_URL = 'https://api.spotify.com/v1/me/playlists'

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
    const URI = 'https://api.spotify.com/v1/me/playlists'
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
    const URI = `https://api.spotify.com/v1/playlists/${id}/tracks`

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
      Authorization: `Bearer BQAYxqJ6ox5qIHJAVp6cMFK3sYwDJ4jwOQuF7WheuNXYUy8KpYqsld3ETBK2PxjQRxQNrx6sbVWQlGnOhMPbQSLHNYInnseOFO6yPXfmYu6SSzpW_sw0G5ZyYoXutBxqkqzFIW-O0lfzRU1wKxR1Ywayt3PcBkFiJH0RW2ylp1cyrBK_RuWqUkxrZJoQw5cO6kDJPFljgRRQucbHrdPTt6I5iuPHr8379_E_m0w`,
    }
  }

  getPostHeader() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer BQAYxqJ6ox5qIHJAVp6cMFK3sYwDJ4jwOQuF7WheuNXYUy8KpYqsld3ETBK2PxjQRxQNrx6sbVWQlGnOhMPbQSLHNYInnseOFO6yPXfmYu6SSzpW_sw0G5ZyYoXutBxqkqzFIW-O0lfzRU1wKxR1Ywayt3PcBkFiJH0RW2ylp1cyrBK_RuWqUkxrZJoQw5cO6kDJPFljgRRQucbHrdPTt6I5iuPHr8379_E_m0w`,
    }
  }
}

const SMART_PLAYLISTS = ['Festival'] //, 'Banger']
const CHECK_PLAYLISTS = [
  // 'Beats',
  // 'Chill Vibes',
  // 'Deep Dark n Dangerous',
  // 'Deep In The Night',
  // 'DnB',
  // 'DnB Liquid',
  'Heavy Shit',
  // 'Midtempo',
  // 'Neuro Bass',
  // 'Riddim',
]

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

  // filter out the ones we don't care about
  const filteredPlaylists = allPlaylists.filter(
    (playlist) =>
      SMART_PLAYLISTS.some((name) => playlist.name.startsWith(name)) ||
      (CHECK_PLAYLISTS.some((name) => playlist.name.startsWith(name)) &&
        playlist.name !== 'Festival Test')
  )

  // filteredPlaylists.forEach((playlist) => {
  //   console.log(playlist.name)
  // })

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

  // console.log(mapped)

  // once we grab all the tracks, lets categorize them
  Promise.all(mapped).then((mappedPlaylists) => {
    // const banger = mappedPlaylists.filter(
    //   (playlist) => playlist.name === 'Banger'
    // )
    // console.log(mappedPlaylists)
    const festival = mappedPlaylists.filter(
      (playlist) => playlist.name === 'Festival'
    )[0]
    const festivalNotHeavy = mappedPlaylists.filter(
      (playlist) => playlist.name === 'Festival Not Heavy'
    )[0]
    const heavy = mappedPlaylists.filter(
      (playlist) => playlist.name === 'Heavy Shit'
    )[0]
    const checkPlaylists = mappedPlaylists.filter(
      (playlist) => playlist.name !== 'Festival' // && playlist.name !== 'Banger'
    )
    const heavyRefs = heavy.tracks.map((track) => track.href)
    const festivalNotHeavyRefs = festivalNotHeavy.tracks.map(
      (track) => track.href
    )

    // Move all not heavy songs to Festival Not Heavy
    const festivalNotHeavyArr: MappedTrack[] = []
    festival.tracks.forEach((track) => {
      if (
        !heavyRefs.includes(track.href) &&
        !festivalNotHeavyRefs.includes(track.href)
      ) {
        festivalNotHeavyArr.push(track)
      }
    })
    const uris = festivalNotHeavyArr.map((track) => track.uri)
    console.log(uris.length)
    spotify.postPlaylistTracks(festivalNotHeavy.playlistId, uris)
  })
}

function trackReducer(tracks: any[]): MappedTrack[] {
  return tracks.map((track) => {
    return {
      name: track.track.name,
      href: track.track.href,
      uri: track.track.uri,
      // artists: track.track.artists,
    }
  })
}

run()
