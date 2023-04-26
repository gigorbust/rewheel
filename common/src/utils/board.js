export const BoardGeneration = {
  V1: 1,
  V1_2: 2,
  Plus: 3,
  XR: 4,
  Pint: 5,
  GT: 6,
  PintX: 7,
}

export const inferBoardFromFirmwareRevision = (revision) => {
  const generation = Math.floor(revision / 1000)
  const subrevision = revision % 1000

  if (generation === 5 && subrevision > 70) return Object.keys(BoardGeneration)[generation + 2 - 1]

  return Object.keys(BoardGeneration)[generation - 1]
}

export const getRevisionInformation = (revision) => {
  const ones = Math.floor(revision % 10), tens = Math.floor(revision / 10 % 10), hundreds = Math.floor(revision / 100 % 10)
  const thousands = Math.floor(revision / 1000 % 10)
  return { major: thousands, minor: hundreds, patch: hundreds * 100 + tens * 10 + ones }
}

export const allGenerations = [1, 2, 3, 4, 5, 6, 7]
export const allPreGTGenerations = [1, 2, 3, 4, 5, 7]

export const inferBoardFromHardwareRevision = (revision) => {
  const generation = Math.floor(revision / 1000)
  const subrevision = revision % 1000

  return Object.keys(BoardGeneration)[generation - 1]
}