import tokens from './tokens.json';

export const hongyishiBrand = tokens;

export const hongyishiBrandCssVariables = {
  '--hys-color-constructivism-red': hongyishiBrand.colors.constructivismRed,
  '--hys-color-field-red': hongyishiBrand.colors.fieldRed,
  '--hys-color-signal-orange': hongyishiBrand.colors.signalOrange,
  '--hys-color-technology-blue': hongyishiBrand.colors.technologyBlue,
  '--hys-color-clinical-cyan': hongyishiBrand.colors.clinicalCyan,
  '--hys-color-field-navy': hongyishiBrand.colors.fieldNavy,
  '--hys-color-structure-yellow': hongyishiBrand.colors.structureYellow,
  '--hys-color-ink': hongyishiBrand.colors.ink,
  '--hys-color-paper': hongyishiBrand.colors.paper,
  '--hys-color-aged-paper': hongyishiBrand.colors.agedPaper,
  '--hys-color-muted': hongyishiBrand.colors.muted,
  '--hys-radius-card': hongyishiBrand.radius.card,
  '--hys-radius-control': hongyishiBrand.radius.control,
} as const;

export type HongyishiBrand = typeof hongyishiBrand;

export const hongyishiPlatformPaths = {
  home: '/',
  fms: '/fms/',
  heatStroke: '/heat-stroke/',
} as const;
