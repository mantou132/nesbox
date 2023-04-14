import { convertToMap } from 'duoyun-ui/lib/utils';
import { ElementOf } from 'duoyun-ui/lib/types';

import { LocaleKey } from 'src/i18n/basic';
import { ScGameKind, ScGameSeries } from 'src/generated/graphql';

export const gameKindList: { value: ScGameKind | ''; label: LocaleKey }[] = [
  {
    value: '',
    label: 'noLimit',
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
    label: 'noLimit',
  },
  {
    value: ScGameSeries.Mario,
    label: 'gameSeriesMario',
  },
  {
    value: ScGameSeries.Contra,
    label: 'gameSeriesContra',
  },
  {
    value: ScGameSeries.DoubleDragon,
    label: 'gameSeriesDoubleDragon',
  },
  {
    value: ScGameSeries.MegaMan,
    label: 'gameSeriesMegaMan',
  },
  {
    value: ScGameSeries.Nekketsu,
    label: 'gameSeriesNekketsu',
  },
  {
    value: ScGameSeries.NinjaGaiden,
    label: 'gameSeriesNinjaGaiden',
  },
  {
    value: ScGameSeries.StreetFighter,
    label: 'gameSeriesStreetFighter',
  },
  {
    value: ScGameSeries.Tank,
    label: 'gameSeriesTank',
  },
  {
    value: ScGameSeries.Tmnt,
    label: 'gameSeriesTmnt',
  },
  {
    value: ScGameSeries.AdventureIsland,
    label: 'gameSeriesAdventureIsland',
  },
  {
    value: ScGameSeries.ChipDale,
    label: 'gameSeriesChipDale',
  },
  {
    value: ScGameSeries.DragonBall,
    label: 'gameSeriesDragonBall',
  },
  {
    value: ScGameSeries.LodeRunner,
    label: 'gameSeriesLodeRunner',
  },
  {
    value: ScGameSeries.SanGokuShi,
    label: 'gameSeriesSanGokuShi',
  },
];
export const gameSeriesMap = convertToMap<ElementOf<typeof gameSeriesList>, LocaleKey>(
  gameSeriesList,
  'value',
  'label',
);
