import fetch from 'node-fetch'

// TODO: Handle errors and non 200's

const BASE_URI = 'https://api.spotify.com/v1'
// const TOKEN_URI = 'https://accounts.spotify.com/api/token'

// TODO: Get token in app
const TOKEN =
  'BQALg6EmooLfUqqukGv_omRk_zbtUuw_5NPseU9Oi67INSdqJJzlD8jJFO5UN8HzEZhMIEP9f88vQFTfBiCpC1Z6-kHioZdWG0qvNtsKcLKYWAqttTv4zqTnne7tk50ymvhdBUvJF9pqwSh5rWJzHLR0npamSvJzTSjRAqlVQ-vcz8qHeeunpx19gRPHPOTIrLM4zkGTasfLH-fzY7svcxYRCUdj49_8NhBhwFk'

interface Credentials {
  id: string | undefined
  secret: string | undefined
}

interface Token {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

export interface MappedPlaylist {
  name: string
  playlistId: string
  tracks: MappedTrack[]
}

interface MappedTrack {
  name: string
  href: string
  uri: string
  id: string
}

export interface RemoveTrack {
  uri: string
}

export class Spotify {
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

  // async setToken() {
  //   const auth = Buffer.from(
  //     `${this.credentials.id}:${this.credentials.secret}`
  //   ).toString('base64')

  //   const opts = {
  //     method: 'POST',
  //     body: 'grant_type=client_credentials',
  //     headers: {
  //       'Content-Type': 'application/x-www-form-urlencoded',
  //       Authorization: `Basic ${auth}`,
  //     },
  //   }
  //   try {
  //     const res = await fetch(TOKEN_URI, opts)

  //     if (res.status !== 200) throw res

  //     this.token = await res.json()
  //   } catch (err) {
  //     err.text().then((text: string) => console.log('Fetch Error:\n', text))
  //   }
  // }

  // isTokenExpired() {
  //   if (this.token) {
  //     if (Date.now() / 1000 >= this.token.expires_at - 300) {
  //       return true
  //     }
  //   }
  //   return false
  // }

  async getAllMyPlaylists() {
    const url = `${BASE_URI}/me/playlists`
    const opts: any = { method: 'GET' } // TODO: Fix type any here
    opts.headers = this.getTokenHeader()

    const res = await fetch(url, opts)
    const playlists = await res.json()

    // Fancy smanshy recursion (go until next is null)
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

    // Fancy smanshy recursion (go until next is null)
    if (tracks.next) {
      return tracks.items.concat(await this.getAllPlaylistTracks(tracks.next))
    } else {
      return tracks.items
    }
  }

  async mapPlaylistTracks(playlist): Promise<MappedPlaylist> {
    const mappedPlaylist: MappedPlaylist = {
      name: playlist.name,
      playlistId: playlist.id,
      tracks: [],
    }

    const items = await this.getAllPlaylistTracks(playlist.tracks.href)
    console.log(items)

    if (items.length > 0) mappedPlaylist.tracks = this.trackReducer(items)

    return mappedPlaylist
  }

  async postPlaylistTracks(id: string, uris: string[]) {
    if (uris.length === 0) return
    const url = `${BASE_URI}/playlists/${id}/tracks`
    const opts: any = { method: 'POST', body: JSON.stringify({ uris }) }
    opts.headers = this.getPostHeader()

    // TODO: Handle when over 100 items
    if (uris.length > 99)
      throw new Error('Too many items in URIs. Split them up please.')

    const res = await fetch(url, opts)
    const log = await res.json()
    console.log(log)
    return log
  }

  async removePlaylistTracks(id: string, uris: RemoveTrack[]) {
    if (uris.length === 0) return
    const url = `${BASE_URI}/playlists/${id}/tracks`
    const opts: any = {
      method: 'DELETE',
      body: JSON.stringify({ tracks: uris }),
    }
    opts.headers = this.getPostHeader()

    // TODO: Handle when over 100 items
    if (uris.length > 99)
      throw new Error('Too many items in URIs. Split them up please.')

    const res = await fetch(url, opts)
    const log = await res.json()
    console.log(log)
    return log
  }

  async getLikedTracks(playlistTracks: MappedPlaylist) {
    const ids = playlistTracks.tracks.map(track => track.id)

    const liked = await this.handleLikedIds(ids, 0)

    return playlistTracks.tracks.filter((track, index) => liked[index])
  }

  async handleLikedIds(ids: string[], start = 0) {
    const url = `${BASE_URI}/me/tracks/contains?ids=${encodeURIComponent(
      ids.slice(start, start + 50).join(',')
    )}`

    const opts: any = {
      method: 'GET',
    }
    opts.headers = this.getPostHeader()

    const res = await fetch(url, opts)
    const liked = await res.json()

    start += 50
    if (start < ids.length) {
      return liked.concat(await this.handleLikedIds(ids, start))
    } else {
      return liked
    }
  }

  trackReducer(tracks: any[]): MappedTrack[] {
    return tracks.map(track => {
      return {
        name: track.track.name,
        href: track.track.href,
        uri: track.track.uri,
        id: track.track.id,
      }
    })
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
