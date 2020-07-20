export interface SmartPlaylist {
  source: string
  check: string
  notPlaylist: boolean
}

// notPlaylist = Festival Not Heavy, Bangers Not Heavy (essentially do the opposite when categorizing)
// I really need a better name but I've got nothin
export const smartPlaylists: SmartPlaylist[] = [
  // { source: 'Festival', check: 'Heavy', notPlaylist: true },
  // { source: 'Family', check: 'Test', notPlaylist: true }, // TODO: what to do with test?
  // { source: 'Banger', check: 'Heavy', notPlaylist: true },
  { source: 'Banger', check: 'Beats', notPlaylist: false },
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

export const checkPlaylists = [
  'Festival',
  'Family',
  'Banger',
  'Beats',
  'Chill Vibes',
  'Deep Dark n Dangerous',
  'Deep In The Night',
  'DnB',
  'DnB Liquid',
  'Family Test',
  'Festival Test',
  'GOAT',
  'Heavy',
  'Midtempo',
  'Weird',
  'Mix This',
  'Neuro Bass',
  'Rap/Hip Hop',
  'Riddim',
  'Trippy Shit',
  'Wonky',
  'Feels',
]

// TODO: WHAT IF IT"S IN BANGER DNB BUT NOT BANGER??
