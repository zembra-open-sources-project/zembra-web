import { common as enCommon } from "./locales/en-US/common";
import { home as enHome } from "./locales/en-US/home";
import { settings as enSettings } from "./locales/en-US/settings";
import { common as zhCnCommon } from "./locales/zh-CN/common";
import { home as zhCnHome } from "./locales/zh-CN/home";
import { settings as zhCnSettings } from "./locales/zh-CN/settings";
import { common as zhTwCommon } from "./locales/zh-TW/common";
import { home as zhTwHome } from "./locales/zh-TW/home";
import { settings as zhTwSettings } from "./locales/zh-TW/settings";

export const resources = {
  "zh-CN": {
    common: zhCnCommon,
    home: zhCnHome,
    settings: zhCnSettings,
  },
  "zh-TW": {
    common: zhTwCommon,
    home: zhTwHome,
    settings: zhTwSettings,
  },
  "en-US": {
    common: enCommon,
    home: enHome,
    settings: enSettings,
  },
} as const;
