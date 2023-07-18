import en_US from './en_US'
import zh_CN from './zh_CN'
import zh_TW from './zh_TW'
import ru_RU from './ru_RU'

const Langs = {
  en_US,
  zh_CN,
  zh_TW,
  ru_RU
}

const __ = (_id: number) => {
  const lang = Langs.en_US
  // console.log(lang)
  switch (lang) {
    case en_US:
      return lang
  }
}

export default __
