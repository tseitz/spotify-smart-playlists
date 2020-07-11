import fetch from 'node-fetch'

const TOKEN_URI = 'https://accounts.spotify.com/api/token'
const BASE_URI = 'https://api.spotify.com/v1'

interface Credentials {
  id: string
  secret: string
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

  getTokenHeader() {
    // if (!this.token || !this.token.access_token) {
    //   throw new Error(
    //     "An error has occurred. Make sure you're using a valid client id and secret.'"
    //   )
    // }
    return {
      Authorization: `Bearer BQAdUURJDAhR_H4eeNRSNBCPBsdFN4N0OVP7-DLr3-w3JMq19dc-IpTe8qtzWIoHyKWG_allMCXnA5JebvJs3hjIxxOSjYGVLnsPrYQwAQ0XPpV5_p7iD9Hg7JljLaHZ0tgFPOiRVtmQEiterDHsTuH-86Ro68AtRJIaUaYbd-ONt3-rUqoc9Vz_sM_Z50J4E-AQa4hP6-D4mpB5hG4hnZuNnYstd85YrhlZIDg`,
    }
  }
}

const SMART_PLAYLISTS = ['Festival', 'Bangers']

const spotify = new Spotify({
  id: process.env.SPOTIFY_CLIENT_ID,
  secret: process.env.SPOTIFY_CLIENT_SECRET,
})

const playlists = []
spotify.getPlaylists().then((res) => {
  res.items.forEach((playlist, index) => {
    const mappedPlaylist = { name: playlist.name, items: [] }
    if (index < 3) {
      spotify.getAllPlaylistTracks(playlist.tracks.href).then((items) => {
        mappedPlaylist.items = trackReducer(items)
        playlists.push(mappedPlaylist)
        console.log(playlists)
      })
    }
  })
})

function trackReducer(tracks: any[]) {
  return tracks.map((track) => {
    return {
      name: track.track.name,
      href: track.track.href,
      artists: track.track.artists,
    }
  })
}
