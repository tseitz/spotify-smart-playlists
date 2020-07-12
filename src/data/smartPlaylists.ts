export interface SmartPlaylist {
  source: string
  check: string
  notPlaylist: boolean
}

// notPlaylist = Festival Not Heavy, Bangers Not Heavy (essentially do the opposite when categorizing)
export const smartPlaylists: SmartPlaylist[] = [
  { source: 'Festival', check: 'Heavy', notPlaylist: true },
  // { source: 'Family', check: 'Test', notPlaylist: true }, // TODO: what to do with test?
  // { source: 'Banger', check: 'Heavy', notPlaylist: true },
  // { source: 'Banger', check: 'Beats', notPlaylist: false },
  // { source: 'Banger', check: 'Chill Vibes', notPlaylist: false },
  // { source: 'Banger', check: 'Deep Dark n Dangerous', notPlaylist: false },
  // { source: 'Banger', check: 'Deep In The Night', notPlaylist: false },
  // { source: 'Banger', check: 'DnB', notPlaylist: false },
  // { source: 'Banger', check: 'DnB Liquid', notPlaylist: false },
  // { source: 'Banger', check: 'Heavy', notPlaylist: false },
  // { source: 'Banger', check: 'Midtempo', notPlaylist: false },
  // { source: 'Banger', check: 'Neuro Bass', notPlaylist: false },
  // { source: 'Banger', check: 'Riddim', notPlaylist: false },
]

// TODO: WHAT IF IT"S IN BANGER DNB BUT NOT BANGER??
