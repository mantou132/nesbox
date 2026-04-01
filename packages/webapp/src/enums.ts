import type { ElementOf } from 'duoyun-ui/lib/types';
import { convertToMap } from 'duoyun-ui/lib/utils';
import { ScGameKind, ScGamePlatform, ScGameSeries } from 'src/generated/graphql';
import type { LocaleKey } from 'src/i18n/basic';

export const gameKindList: { value: ScGameKind | ''; label: LocaleKey }[] = [
  {
    value: '',
    label: 'global.noLimit',
  },
  {
    value: ScGameKind.Act,
    label: 'enum.gameKind.act',
  },
  {
    value: ScGameKind.Ftg,
    label: 'enum.gameKind.ftg',
  },
  {
    value: ScGameKind.Stg,
    label: 'enum.gameKind.stg',
  },
  {
    value: ScGameKind.Spg,
    label: 'enum.gameKind.spg',
  },
  {
    value: ScGameKind.Rpg,
    label: 'enum.gameKind.rpg',
  },
  {
    // ScGameKind.Tbs, ScGameKind.Slg, ScGameKind.Tbg
    value: ScGameKind.Rts,
    label: 'enum.gameKind.strategy',
  },
  {
    // ScGameKind.Pzg, ScGameKind.Rcg
    value: ScGameKind.Other,
    label: 'enum.gameKind.other',
  },
];
export const gameKindMap = convertToMap<ElementOf<typeof gameKindList>, LocaleKey>(gameKindList, 'value', 'label');

export const gameSeriesList: { value: ScGameSeries | ''; label: LocaleKey }[] = [
  {
    value: '',
    label: 'global.noLimit',
  },
  {
    value: ScGameSeries.Mario,
    label: 'enum.gameSeries.mario',
  },
  {
    value: ScGameSeries.Contra,
    label: 'enum.gameSeries.contra',
  },
  {
    value: ScGameSeries.DoubleDragon,
    label: 'enum.gameSeries.doubleDragon',
  },
  {
    value: ScGameSeries.MegaMan,
    label: 'enum.gameSeries.megaMan',
  },
  {
    value: ScGameSeries.Nekketsu,
    label: 'enum.gameSeries.nekketsu',
  },
  {
    value: ScGameSeries.NinjaGaiden,
    label: 'enum.gameSeries.ninjaGaiden',
  },
  {
    value: ScGameSeries.StreetFighter,
    label: 'enum.gameSeries.streetFighter',
  },
  {
    value: ScGameSeries.Kof,
    label: 'enum.gameSeries.kof',
  },
  {
    value: ScGameSeries.Tank,
    label: 'enum.gameSeries.tank',
  },
  {
    value: ScGameSeries.Tmnt,
    label: 'enum.gameSeries.tmnt',
  },
  {
    value: ScGameSeries.AdventureIsland,
    label: 'enum.gameSeries.adventureIsland',
  },
  {
    value: ScGameSeries.SanGokuShi,
    label: 'enum.gameSeries.sanGokuShi',
  },
];
export const gameSeriesMap = convertToMap<ElementOf<typeof gameSeriesList>, LocaleKey>(
  gameSeriesList,
  'value',
  'label',
);

export const gamePlatformList: { value: ScGamePlatform | ''; label: LocaleKey }[] = [
  {
    value: '',
    label: 'global.noLimit',
  },
  {
    value: ScGamePlatform.Arcade,
    label: 'enum.gamePlatform.arcade',
  },
  {
    value: ScGamePlatform.Nes,
    label: 'enum.gamePlatform.nes',
  },
  {
    value: ScGamePlatform.UniversalJs,
    label: 'enum.gamePlatform.universalJs',
  },
  {
    value: ScGamePlatform.UniversalWasm,
    label: 'enum.gamePlatform.universalWasm',
  },
  {
    value: ScGamePlatform.Wasm4,
    label: 'enum.gamePlatform.wasm4',
  },
  {
    value: ScGamePlatform.Flash,
    label: 'enum.gamePlatform.flash',
  },
];

export const gamePlatformMap = convertToMap<ElementOf<typeof gamePlatformList>, LocaleKey>(
  gamePlatformList,
  'value',
  'label',
);
