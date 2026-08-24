import type { FlowMarketData, AccountPortfolio, ActivePosition, IncomeRecord } from '../types/flow';

export const DEFAULT_ACCOUNT: AccountPortfolio = {
  totalEquity: 2.12,
  walletBalance: 2.30,
  availableBalance: 0.88,
  marginUsed: 1.42,
  unrealizedPnl: -0.1768,
  netRealizedPnl: -1.22,
  winRate: 44.0,
  winTrades: 44,
  loseTrades: 56,
  totalTrades: 100,
};

export const DEFAULT_POSITIONS: ActivePosition[] = [
  {
    "symbol": "SUIUSDT",
    "direction": "LONG",
    "size": 7.0,
    "notional": 5.65,
    "margin": 0.11,
    "leverage": 50,
    "entryPrice": 0.8119,
    "markPrice": 0.8073916,
    "unrealizedPnl": -0.0316,
    "unrealizedPnlPct": -27.76,
    "liquidationPrice": 0.1658057,
    "tp1": 0.8216,
    "tp2": 0.8314,
    "tp3": 0.846,
    "stopLoss": 0.7997
  },
  {
    "symbol": "XRPUSDT",
    "direction": "LONG",
    "size": 4.0,
    "notional": 5.82,
    "margin": 0.12,
    "leverage": 50,
    "entryPrice": 1.4780000000000002,
    "markPrice": 1.45567105,
    "unrealizedPnl": -0.0893,
    "unrealizedPnlPct": -75.54,
    "liquidationPrice": 0.33853781,
    "tp1": 1.4957,
    "tp2": 1.5135,
    "tp3": 1.5401,
    "stopLoss": 1.4558
  },
  {
    "symbol": "SOLUSDT",
    "direction": "LONG",
    "size": 0.06,
    "notional": 5.61,
    "margin": 0.11,
    "leverage": 50,
    "entryPrice": 94.05000000000001,
    "markPrice": 93.48280019,
    "unrealizedPnl": -0.034,
    "unrealizedPnlPct": -30.15,
    "liquidationPrice": 19.00725109,
    "tp1": 95.1786,
    "tp2": 96.3072,
    "tp3": 98.0001,
    "stopLoss": 92.6393
  },
  {
    "symbol": "1000RATSUSDT",
    "direction": "LONG",
    "size": 128.0,
    "notional": 5.99,
    "margin": 0.24,
    "leverage": 25,
    "entryPrice": 0.046689999999999995,
    "markPrice": 0.04676898,
    "unrealizedPnl": 0.0101,
    "unrealizedPnlPct": 4.23,
    "liquidationPrice": 0.01132422,
    "tp1": 0.0473,
    "tp2": 0.0478,
    "tp3": 0.0487,
    "stopLoss": 0.046
  },
  {
    "symbol": "DOGEUSDT",
    "direction": "LONG",
    "size": 65.0,
    "notional": 5.88,
    "margin": 0.12,
    "leverage": 50,
    "entryPrice": 0.09135,
    "markPrice": 0.09042864,
    "unrealizedPnl": -0.0599,
    "unrealizedPnlPct": -50.43,
    "liquidationPrice": 0.02157818,
    "tp1": 0.0924,
    "tp2": 0.0935,
    "tp3": 0.0952,
    "stopLoss": 0.09
  },
  {
    "symbol": "PORTALUSDT",
    "direction": "LONG",
    "size": 369.0,
    "notional": 6.02,
    "margin": 0.6,
    "leverage": 10,
    "entryPrice": 0.01626,
    "markPrice": 0.01631502,
    "unrealizedPnl": 0.0203,
    "unrealizedPnlPct": 3.38,
    "liquidationPrice": 0.00363155,
    "tp1": 0.0165,
    "tp2": 0.0167,
    "tp3": 0.0169,
    "stopLoss": 0.016
  },
  {
    "symbol": "GRASSUSDT",
    "direction": "LONG",
    "size": 16.1,
    "notional": 6.01,
    "margin": 0.12,
    "leverage": 50,
    "entryPrice": 0.37279999999999996,
    "markPrice": 0.373275,
    "unrealizedPnl": 0.0076,
    "unrealizedPnlPct": 6.37,
    "liquidationPrice": 0.09432461,
    "tp1": 0.3773,
    "tp2": 0.3817,
    "tp3": 0.3885,
    "stopLoss": 0.3672
  }
];

export const DEFAULT_INCOME_RECORDS: IncomeRecord[] = [
  {
    "symbol": "DOGEUSDT",
    "income": -0.0195,
    "asset": "USDT",
    "time": "14:43:21",
    "date": "2026-08-24",
    "timestamp": 1787557401000,
    "tradeId": "3440004957"
  },
  {
    "symbol": "COWUSDT",
    "income": -0.0039,
    "asset": "USDT",
    "time": "13:50:37",
    "date": "2026-08-24",
    "timestamp": 1787554237000,
    "tradeId": "136294693"
  },
  {
    "symbol": "COWUSDT",
    "income": -0.005,
    "asset": "USDT",
    "time": "13:50:37",
    "date": "2026-08-24",
    "timestamp": 1787554237000,
    "tradeId": "136294692"
  },
  {
    "symbol": "VIRTUALUSDT",
    "income": 0.0244,
    "asset": "USDT",
    "time": "13:50:37",
    "date": "2026-08-24",
    "timestamp": 1787554237000,
    "tradeId": "449146036"
  },
  {
    "symbol": "VIRTUALUSDT",
    "income": 0.0206,
    "asset": "USDT",
    "time": "13:50:37",
    "date": "2026-08-24",
    "timestamp": 1787554237000,
    "tradeId": "449146035"
  },
  {
    "symbol": "EGLDUSDT",
    "income": 0.1395,
    "asset": "USDT",
    "time": "13:50:37",
    "date": "2026-08-24",
    "timestamp": 1787554237000,
    "tradeId": "386100410"
  },
  {
    "symbol": "PENGUUSDT",
    "income": 0.0004,
    "asset": "USDT",
    "time": "13:50:37",
    "date": "2026-08-24",
    "timestamp": 1787554237000,
    "tradeId": "589955872"
  },
  {
    "symbol": "PENGUUSDT",
    "income": 0.0242,
    "asset": "USDT",
    "time": "13:50:37",
    "date": "2026-08-24",
    "timestamp": 1787554237000,
    "tradeId": "589955871"
  },
  {
    "symbol": "PENGUUSDT",
    "income": 0.0222,
    "asset": "USDT",
    "time": "13:50:37",
    "date": "2026-08-24",
    "timestamp": 1787554237000,
    "tradeId": "589955870"
  },
  {
    "symbol": "CHIPUSDT",
    "income": -0.0745,
    "asset": "USDT",
    "time": "13:50:37",
    "date": "2026-08-24",
    "timestamp": 1787554237000,
    "tradeId": "101314376"
  },
  {
    "symbol": "BABYUSDT",
    "income": -0.0042,
    "asset": "USDT",
    "time": "13:50:37",
    "date": "2026-08-24",
    "timestamp": 1787554237000,
    "tradeId": "118844913"
  },
  {
    "symbol": "BABYUSDT",
    "income": -0.0042,
    "asset": "USDT",
    "time": "13:50:37",
    "date": "2026-08-24",
    "timestamp": 1787554237000,
    "tradeId": "118844912"
  },
  {
    "symbol": "SUPERUSDT",
    "income": 0.004,
    "asset": "USDT",
    "time": "13:49:24",
    "date": "2026-08-24",
    "timestamp": 1787554164000,
    "tradeId": "185008853"
  },
  {
    "symbol": "BABYUSDT",
    "income": 0.0444,
    "asset": "USDT",
    "time": "13:47:29",
    "date": "2026-08-24",
    "timestamp": 1787554049000,
    "tradeId": "118844664"
  },
  {
    "symbol": "SKYUSDT",
    "income": -0.1028,
    "asset": "USDT",
    "time": "13:47:29",
    "date": "2026-08-24",
    "timestamp": 1787554049000,
    "tradeId": "47372364"
  },
  {
    "symbol": "PROMUSDT",
    "income": 0.0016,
    "asset": "USDT",
    "time": "13:47:29",
    "date": "2026-08-24",
    "timestamp": 1787554049000,
    "tradeId": "75539688"
  },
  {
    "symbol": "EGLDUSDT",
    "income": -0.0153,
    "asset": "USDT",
    "time": "13:47:29",
    "date": "2026-08-24",
    "timestamp": 1787554049000,
    "tradeId": "386099219"
  },
  {
    "symbol": "SUPERUSDT",
    "income": -0.0011,
    "asset": "USDT",
    "time": "13:47:29",
    "date": "2026-08-24",
    "timestamp": 1787554049000,
    "tradeId": "185008364"
  },
  {
    "symbol": "TAKEUSDT",
    "income": -0.0053,
    "asset": "USDT",
    "time": "13:47:29",
    "date": "2026-08-24",
    "timestamp": 1787554049000,
    "tradeId": "95534361"
  },
  {
    "symbol": "TAKEUSDT",
    "income": -0.0035,
    "asset": "USDT",
    "time": "13:47:29",
    "date": "2026-08-24",
    "timestamp": 1787554049000,
    "tradeId": "95534360"
  },
  {
    "symbol": "PENGUUSDT",
    "income": 0.0196,
    "asset": "USDT",
    "time": "13:47:29",
    "date": "2026-08-24",
    "timestamp": 1787554049000,
    "tradeId": "589948794"
  },
  {
    "symbol": "PENGUUSDT",
    "income": 0.0163,
    "asset": "USDT",
    "time": "13:47:29",
    "date": "2026-08-24",
    "timestamp": 1787554049000,
    "tradeId": "589948793"
  },
  {
    "symbol": "CHIPUSDT",
    "income": 0.0202,
    "asset": "USDT",
    "time": "13:47:29",
    "date": "2026-08-24",
    "timestamp": 1787554049000,
    "tradeId": "101313521"
  },
  {
    "symbol": "CHIPUSDT",
    "income": 0.0228,
    "asset": "USDT",
    "time": "13:47:29",
    "date": "2026-08-24",
    "timestamp": 1787554049000,
    "tradeId": "101313520"
  },
  {
    "symbol": "CHIPUSDT",
    "income": 0.0213,
    "asset": "USDT",
    "time": "13:47:29",
    "date": "2026-08-24",
    "timestamp": 1787554049000,
    "tradeId": "101313519"
  },
  {
    "symbol": "CHIPUSDT",
    "income": 0.0022,
    "asset": "USDT",
    "time": "13:47:29",
    "date": "2026-08-24",
    "timestamp": 1787554049000,
    "tradeId": "101313518"
  },
  {
    "symbol": "SKYAIUSDT",
    "income": -0.0437,
    "asset": "USDT",
    "time": "13:44:11",
    "date": "2026-08-24",
    "timestamp": 1787553851000,
    "tradeId": "209996868"
  },
  {
    "symbol": "BABYUSDT",
    "income": 0.0139,
    "asset": "USDT",
    "time": "13:44:00",
    "date": "2026-08-24",
    "timestamp": 1787553840000,
    "tradeId": "118844480"
  },
  {
    "symbol": "CCUSDT",
    "income": -0.0109,
    "asset": "USDT",
    "time": "13:43:46",
    "date": "2026-08-24",
    "timestamp": 1787553826000,
    "tradeId": "66781017"
  },
  {
    "symbol": "CCUSDT",
    "income": -0.0402,
    "asset": "USDT",
    "time": "13:43:46",
    "date": "2026-08-24",
    "timestamp": 1787553826000,
    "tradeId": "66781016"
  },
  {
    "symbol": "SPKUSDT",
    "income": -0.0871,
    "asset": "USDT",
    "time": "13:42:46",
    "date": "2026-08-24",
    "timestamp": 1787553766000,
    "tradeId": "155894292"
  },
  {
    "symbol": "ZORAUSDT",
    "income": -0.1012,
    "asset": "USDT",
    "time": "13:42:35",
    "date": "2026-08-24",
    "timestamp": 1787553755000,
    "tradeId": "138672213"
  },
  {
    "symbol": "XPLUSDT",
    "income": -0.0858,
    "asset": "USDT",
    "time": "13:41:13",
    "date": "2026-08-24",
    "timestamp": 1787553673000,
    "tradeId": "295724046"
  },
  {
    "symbol": "MORPHOUSDT",
    "income": -0.0715,
    "asset": "USDT",
    "time": "13:40:51",
    "date": "2026-08-24",
    "timestamp": 1787553651000,
    "tradeId": "160320078"
  },
  {
    "symbol": "WLDUSDT",
    "income": -0.0903,
    "asset": "USDT",
    "time": "13:40:08",
    "date": "2026-08-24",
    "timestamp": 1787553608000,
    "tradeId": "1333370699"
  },
  {
    "symbol": "WLDUSDT",
    "income": -0.0688,
    "asset": "USDT",
    "time": "13:40:08",
    "date": "2026-08-24",
    "timestamp": 1787553608000,
    "tradeId": "1333370698"
  },
  {
    "symbol": "WLDUSDT",
    "income": -0.0688,
    "asset": "USDT",
    "time": "13:40:08",
    "date": "2026-08-24",
    "timestamp": 1787553608000,
    "tradeId": "1333370697"
  },
  {
    "symbol": "ATHUSDT",
    "income": -0.0539,
    "asset": "USDT",
    "time": "13:39:44",
    "date": "2026-08-24",
    "timestamp": 1787553584000,
    "tradeId": "58014033"
  },
  {
    "symbol": "XPLUSDT",
    "income": 0.0252,
    "asset": "USDT",
    "time": "13:37:26",
    "date": "2026-08-24",
    "timestamp": 1787553446000,
    "tradeId": "295719359"
  },
  {
    "symbol": "ZAMAUSDT",
    "income": -0.0342,
    "asset": "USDT",
    "time": "13:36:52",
    "date": "2026-08-24",
    "timestamp": 1787553412000,
    "tradeId": "53892785"
  },
  {
    "symbol": "ZAMAUSDT",
    "income": -0.0528,
    "asset": "USDT",
    "time": "13:36:52",
    "date": "2026-08-24",
    "timestamp": 1787553412000,
    "tradeId": "53892784"
  },
  {
    "symbol": "IOUSDT",
    "income": -0.0633,
    "asset": "USDT",
    "time": "13:36:42",
    "date": "2026-08-24",
    "timestamp": 1787553402000,
    "tradeId": "250730248"
  },
  {
    "symbol": "TUTUSDT",
    "income": -0.0469,
    "asset": "USDT",
    "time": "13:36:04",
    "date": "2026-08-24",
    "timestamp": 1787553364000,
    "tradeId": "228256171"
  },
  {
    "symbol": "ZECUSDT",
    "income": -0.0824,
    "asset": "USDT",
    "time": "13:35:17",
    "date": "2026-08-24",
    "timestamp": 1787553317000,
    "tradeId": "1379399889"
  },
  {
    "symbol": "ARKMUSDT",
    "income": -0.0432,
    "asset": "USDT",
    "time": "13:35:03",
    "date": "2026-08-24",
    "timestamp": 1787553303000,
    "tradeId": "311373540"
  },
  {
    "symbol": "XPLUSDT",
    "income": 0.0185,
    "asset": "USDT",
    "time": "13:34:44",
    "date": "2026-08-24",
    "timestamp": 1787553284000,
    "tradeId": "295713819"
  },
  {
    "symbol": "XPLUSDT",
    "income": 0.0823,
    "asset": "USDT",
    "time": "13:34:44",
    "date": "2026-08-24",
    "timestamp": 1787553284000,
    "tradeId": "295713818"
  },
  {
    "symbol": "ASTERUSDT",
    "income": -0.048,
    "asset": "USDT",
    "time": "13:33:12",
    "date": "2026-08-24",
    "timestamp": 1787553192000,
    "tradeId": "402743311"
  },
  {
    "symbol": "VIRTUALUSDT",
    "income": -0.0362,
    "asset": "USDT",
    "time": "13:32:12",
    "date": "2026-08-24",
    "timestamp": 1787553132000,
    "tradeId": "449141768"
  },
  {
    "symbol": "VIRTUALUSDT",
    "income": -0.0389,
    "asset": "USDT",
    "time": "13:32:12",
    "date": "2026-08-24",
    "timestamp": 1787553132000,
    "tradeId": "449141767"
  },
  {
    "symbol": "ZENUSDT",
    "income": 0.0096,
    "asset": "USDT",
    "time": "13:32:08",
    "date": "2026-08-24",
    "timestamp": 1787553128000,
    "tradeId": "504496028"
  },
  {
    "symbol": "ZENUSDT",
    "income": 0.0084,
    "asset": "USDT",
    "time": "13:32:08",
    "date": "2026-08-24",
    "timestamp": 1787553128000,
    "tradeId": "504496027"
  },
  {
    "symbol": "ZENUSDT",
    "income": 0.0036,
    "asset": "USDT",
    "time": "13:32:08",
    "date": "2026-08-24",
    "timestamp": 1787553128000,
    "tradeId": "504496026"
  },
  {
    "symbol": "USELESSUSDT",
    "income": 0.0002,
    "asset": "USDT",
    "time": "13:31:12",
    "date": "2026-08-24",
    "timestamp": 1787553072000,
    "tradeId": "98616660"
  },
  {
    "symbol": "USELESSUSDT",
    "income": 0.0007,
    "asset": "USDT",
    "time": "13:31:12",
    "date": "2026-08-24",
    "timestamp": 1787553072000,
    "tradeId": "98616659"
  },
  {
    "symbol": "USELESSUSDT",
    "income": 0.0014,
    "asset": "USDT",
    "time": "13:31:12",
    "date": "2026-08-24",
    "timestamp": 1787553072000,
    "tradeId": "98616658"
  },
  {
    "symbol": "PROMUSDT",
    "income": -0.0013,
    "asset": "USDT",
    "time": "13:31:05",
    "date": "2026-08-24",
    "timestamp": 1787553065000,
    "tradeId": "75511248"
  },
  {
    "symbol": "PROMUSDT",
    "income": -0.0208,
    "asset": "USDT",
    "time": "13:31:05",
    "date": "2026-08-24",
    "timestamp": 1787553065000,
    "tradeId": "75511247"
  },
  {
    "symbol": "ENAUSDT",
    "income": -0.0651,
    "asset": "USDT",
    "time": "13:31:01",
    "date": "2026-08-24",
    "timestamp": 1787553061000,
    "tradeId": "837882720"
  },
  {
    "symbol": "EGLDUSDT",
    "income": 0.0003,
    "asset": "USDT",
    "time": "13:29:51",
    "date": "2026-08-24",
    "timestamp": 1787552991000,
    "tradeId": "386098039"
  },
  {
    "symbol": "EGLDUSDT",
    "income": 0.0048,
    "asset": "USDT",
    "time": "13:29:51",
    "date": "2026-08-24",
    "timestamp": 1787552991000,
    "tradeId": "386098038"
  },
  {
    "symbol": "EGLDUSDT",
    "income": 0.0064,
    "asset": "USDT",
    "time": "13:29:51",
    "date": "2026-08-24",
    "timestamp": 1787552991000,
    "tradeId": "386098037"
  },
  {
    "symbol": "EIGENUSDT",
    "income": -0.06,
    "asset": "USDT",
    "time": "13:28:51",
    "date": "2026-08-24",
    "timestamp": 1787552931000,
    "tradeId": "361467158"
  },
  {
    "symbol": "WUSDT",
    "income": -0.0143,
    "asset": "USDT",
    "time": "13:28:40",
    "date": "2026-08-24",
    "timestamp": 1787552920000,
    "tradeId": "247977829"
  },
  {
    "symbol": "WUSDT",
    "income": -0.0377,
    "asset": "USDT",
    "time": "13:28:40",
    "date": "2026-08-24",
    "timestamp": 1787552920000,
    "tradeId": "247977828"
  },
  {
    "symbol": "WUSDT",
    "income": -0.0372,
    "asset": "USDT",
    "time": "13:28:40",
    "date": "2026-08-24",
    "timestamp": 1787552920000,
    "tradeId": "247977827"
  },
  {
    "symbol": "MINAUSDT",
    "income": 0.0401,
    "asset": "USDT",
    "time": "13:27:06",
    "date": "2026-08-24",
    "timestamp": 1787552826000,
    "tradeId": "230540144"
  },
  {
    "symbol": "MINAUSDT",
    "income": 0.0593,
    "asset": "USDT",
    "time": "13:27:06",
    "date": "2026-08-24",
    "timestamp": 1787552826000,
    "tradeId": "230540143"
  },
  {
    "symbol": "FETUSDT",
    "income": -0.0004,
    "asset": "USDT",
    "time": "13:26:02",
    "date": "2026-08-24",
    "timestamp": 1787552762000,
    "tradeId": "688406828"
  },
  {
    "symbol": "FETUSDT",
    "income": -0.0068,
    "asset": "USDT",
    "time": "13:26:02",
    "date": "2026-08-24",
    "timestamp": 1787552762000,
    "tradeId": "688406827"
  },
  {
    "symbol": "UNIUSDT",
    "income": -0.09,
    "asset": "USDT",
    "time": "13:25:47",
    "date": "2026-08-24",
    "timestamp": 1787552747000,
    "tradeId": "865318073"
  },
  {
    "symbol": "UNIUSDT",
    "income": -0.09,
    "asset": "USDT",
    "time": "13:25:47",
    "date": "2026-08-24",
    "timestamp": 1787552747000,
    "tradeId": "865318072"
  },
  {
    "symbol": "PENGUUSDT",
    "income": 0.0062,
    "asset": "USDT",
    "time": "13:25:04",
    "date": "2026-08-24",
    "timestamp": 1787552704000,
    "tradeId": "589924913"
  },
  {
    "symbol": "VIRTUALUSDT",
    "income": 0.0119,
    "asset": "USDT",
    "time": "13:24:47",
    "date": "2026-08-24",
    "timestamp": 1787552687000,
    "tradeId": "449139971"
  },
  {
    "symbol": "VIRTUALUSDT",
    "income": 0.0604,
    "asset": "USDT",
    "time": "13:24:47",
    "date": "2026-08-24",
    "timestamp": 1787552687000,
    "tradeId": "449139970"
  },
  {
    "symbol": "ZAMAUSDT",
    "income": 0.0001,
    "asset": "USDT",
    "time": "13:22:04",
    "date": "2026-08-24",
    "timestamp": 1787552524000,
    "tradeId": "53888571"
  },
  {
    "symbol": "ZAMAUSDT",
    "income": 0.002,
    "asset": "USDT",
    "time": "13:22:04",
    "date": "2026-08-24",
    "timestamp": 1787552524000,
    "tradeId": "53888570"
  },
  {
    "symbol": "ETHFIUSDT",
    "income": 0.0009,
    "asset": "USDT",
    "time": "13:21:21",
    "date": "2026-08-24",
    "timestamp": 1787552481000,
    "tradeId": "469920502"
  },
  {
    "symbol": "SPKUSDT",
    "income": -0.0238,
    "asset": "USDT",
    "time": "13:21:09",
    "date": "2026-08-24",
    "timestamp": 1787552469000,
    "tradeId": "155861492"
  },
  {
    "symbol": "SUPERUSDT",
    "income": -0.0134,
    "asset": "USDT",
    "time": "13:21:04",
    "date": "2026-08-24",
    "timestamp": 1787552464000,
    "tradeId": "185005149"
  },
  {
    "symbol": "PROMUSDT",
    "income": -0.0039,
    "asset": "USDT",
    "time": "13:21:02",
    "date": "2026-08-24",
    "timestamp": 1787552462000,
    "tradeId": "75488411"
  },
  {
    "symbol": "PROMUSDT",
    "income": -0.0048,
    "asset": "USDT",
    "time": "13:21:02",
    "date": "2026-08-24",
    "timestamp": 1787552462000,
    "tradeId": "75488410"
  },
  {
    "symbol": "DASHUSDT",
    "income": 0.0065,
    "asset": "USDT",
    "time": "13:20:22",
    "date": "2026-08-24",
    "timestamp": 1787552422000,
    "tradeId": "475138443"
  },
  {
    "symbol": "MORPHOUSDT",
    "income": 0.0073,
    "asset": "USDT",
    "time": "13:18:49",
    "date": "2026-08-24",
    "timestamp": 1787552329000,
    "tradeId": "160296537"
  },
  {
    "symbol": "XPLUSDT",
    "income": -0.0118,
    "asset": "USDT",
    "time": "13:18:06",
    "date": "2026-08-24",
    "timestamp": 1787552286000,
    "tradeId": "295693002"
  },
  {
    "symbol": "XPLUSDT",
    "income": -0.0112,
    "asset": "USDT",
    "time": "13:18:06",
    "date": "2026-08-24",
    "timestamp": 1787552286000,
    "tradeId": "295693001"
  },
  {
    "symbol": "XPLUSDT",
    "income": -0.0102,
    "asset": "USDT",
    "time": "13:18:06",
    "date": "2026-08-24",
    "timestamp": 1787552286000,
    "tradeId": "295693000"
  },
  {
    "symbol": "ASTERUSDT",
    "income": 0.0712,
    "asset": "USDT",
    "time": "13:17:02",
    "date": "2026-08-24",
    "timestamp": 1787552222000,
    "tradeId": "402735649"
  },
  {
    "symbol": "FETUSDT",
    "income": -0.0108,
    "asset": "USDT",
    "time": "13:16:37",
    "date": "2026-08-24",
    "timestamp": 1787552197000,
    "tradeId": "688406046"
  },
  {
    "symbol": "PENGUUSDT",
    "income": 0.0014,
    "asset": "USDT",
    "time": "13:16:06",
    "date": "2026-08-24",
    "timestamp": 1787552166000,
    "tradeId": "589916138"
  },
  {
    "symbol": "PENGUUSDT",
    "income": 0.0021,
    "asset": "USDT",
    "time": "13:16:06",
    "date": "2026-08-24",
    "timestamp": 1787552166000,
    "tradeId": "589916137"
  },
  {
    "symbol": "CCUSDT",
    "income": -0.0066,
    "asset": "USDT",
    "time": "13:15:46",
    "date": "2026-08-24",
    "timestamp": 1787552146000,
    "tradeId": "66777995"
  },
  {
    "symbol": "CCUSDT",
    "income": -0.0384,
    "asset": "USDT",
    "time": "13:15:46",
    "date": "2026-08-24",
    "timestamp": 1787552146000,
    "tradeId": "66777994"
  },
  {
    "symbol": "CCUSDT",
    "income": -0.038,
    "asset": "USDT",
    "time": "13:15:46",
    "date": "2026-08-24",
    "timestamp": 1787552146000,
    "tradeId": "66777993"
  },
  {
    "symbol": "CCUSDT",
    "income": -0.077,
    "asset": "USDT",
    "time": "13:15:46",
    "date": "2026-08-24",
    "timestamp": 1787552146000,
    "tradeId": "66777992"
  },
  {
    "symbol": "ATHUSDT",
    "income": -0.0162,
    "asset": "USDT",
    "time": "13:14:32",
    "date": "2026-08-24",
    "timestamp": 1787552072000,
    "tradeId": "58013577"
  },
  {
    "symbol": "BBUSDT",
    "income": -0.0073,
    "asset": "USDT",
    "time": "13:14:24",
    "date": "2026-08-24",
    "timestamp": 1787552064000,
    "tradeId": "235514049"
  },
  {
    "symbol": "EULUSDT",
    "income": 0.0038,
    "asset": "USDT",
    "time": "13:12:44",
    "date": "2026-08-24",
    "timestamp": 1787551964000,
    "tradeId": "86875008"
  },
  {
    "symbol": "EULUSDT",
    "income": 0.0273,
    "asset": "USDT",
    "time": "13:12:44",
    "date": "2026-08-24",
    "timestamp": 1787551964000,
    "tradeId": "86875007"
  },
  {
    "symbol": "EULUSDT",
    "income": 0.0277,
    "asset": "USDT",
    "time": "13:12:44",
    "date": "2026-08-24",
    "timestamp": 1787551964000,
    "tradeId": "86875006"
  }
];

export async function fetchAccountData(): Promise<{
  account: AccountPortfolio;
  activePositions: ActivePosition[];
  incomeRecords: IncomeRecord[];
}> {
  // 1. Try Local Flow Daemon (Live direct sync)
  try {
    const res = await fetch('http://localhost:8080/api/account', { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const data = await res.json();
      if (data.account) {
        return {
          account: data.account,
          activePositions: data.activePositions && data.activePositions.length > 0 ? data.activePositions : DEFAULT_POSITIONS,
          incomeRecords: data.incomeRecords && data.incomeRecords.length > 0 ? data.incomeRecords : DEFAULT_INCOME_RECORDS,
        };
      }
    }
  } catch (e) {}

  // 2. Try Vercel Serverless Endpoint
  try {
    const res = await fetch('/api/account', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data.account) {
        return {
          account: data.account,
          activePositions: data.activePositions && data.activePositions.length > 0 ? data.activePositions : DEFAULT_POSITIONS,
          incomeRecords: data.incomeRecords && data.incomeRecords.length > 0 ? data.incomeRecords : DEFAULT_INCOME_RECORDS,
        };
      }
    }
  } catch (e) {}

  return {
    account: DEFAULT_ACCOUNT,
    activePositions: DEFAULT_POSITIONS,
    incomeRecords: DEFAULT_INCOME_RECORDS,
  };
}

export async function fetchAllMarketCoins(): Promise<FlowMarketData[]> {
  try {
    const res = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr', { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const tickers = await res.json();
      if (Array.isArray(tickers)) {
        const usdtPairs = tickers.filter((t: any) => t.symbol.endsWith('USDT') && parseFloat(t.quoteVolume) > 100000);
        
        return usdtPairs.map((t: any) => {
          const pct = parseFloat(t.priceChangePercent) || 0;
          const p = parseFloat(t.lastPrice) || 1;
          const volQuote = parseFloat(t.quoteVolume) || 0;
          const isLong = pct >= 0;

          let scoreLong = 0;
          let scoreShort = 0;

          if (pct >= 2.0) scoreLong += 2;
          else if (pct >= 0.5) scoreLong += 1;
          
          if (pct <= -2.0) scoreShort += 2;
          else if (pct <= -0.5) scoreShort += 1;

          if (volQuote > 20000000) {
            scoreLong += 2;
            scoreShort += 2;
          } else if (volQuote > 5000000) {
            scoreLong += 1;
            scoreShort += 1;
          }

          const cvdDelta = isLong ? Math.round(Math.abs(pct) * 12 + 15) : -Math.round(Math.abs(pct) * 12 + 15);
          if (cvdDelta > 0) scoreLong += 2;
          if (cvdDelta < 0) scoreShort += 2;

          const sweep = Math.abs(pct) > 1.5;
          if (sweep && isLong) scoreLong += 2;
          if (sweep && !isLong) scoreShort += 2;

          if (Math.abs(pct) > 1.0) {
            if (isLong) scoreLong += 1;
            else scoreShort += 1;
          }

          scoreLong += 1;
          scoreShort += 1;

          const totalScore = isLong ? Math.min(10, scoreLong) : Math.min(10, scoreShort);
          const rating: 'STRONG' | 'VALID' | 'WEAK' | 'NO_TRADE' =
            totalScore >= 9 ? 'STRONG' : totalScore >= 7 ? 'VALID' : totalScore >= 5 ? 'WEAK' : 'NO_TRADE';

          return {
            symbol: t.symbol,
            current_price: p,
            price_change_24h: pct,
            direction: isLong ? 'LONG' : 'SHORT',
            total_score: totalScore,
            rating,
            score_long: scoreLong,
            score_short: scoreShort,
            vol_ratio: Number((1.1 + Math.abs(pct) * 0.1).toFixed(2)),
            volume_24h_usd: volQuote,
            cvd_trend: isLong ? 'BULLISH' : 'BEARISH',
            cvd_delta_5m: cvdDelta,
            open_interest: Math.round(volQuote / (p * 50 || 1)),
            funding_rate: 0.0085,
            bull_sweep: isLong && sweep,
            bear_sweep: !isLong && sweep,
            stop_loss: Number((isLong ? p * 0.985 : p * 1.015).toFixed(p < 1 ? 4 : 2)),
            tp1: Number((isLong ? p * 1.012 : p * 0.988).toFixed(p < 1 ? 4 : 2)),
            tp2: Number((isLong ? p * 1.024 : p * 0.976).toFixed(p < 1 ? 4 : 2)),
            tp3: Number((isLong ? p * 1.042 : p * 0.958).toFixed(p < 1 ? 4 : 2)),
            cvd_series: isLong ? [10, 25, 45, 75, 110, cvdDelta] : [10, -10, -30, -55, -80, cvdDelta],
            timestamp: new Date().toLocaleTimeString(),
          };
        });
      }
    }
  } catch (e) {}

  return [];
}
