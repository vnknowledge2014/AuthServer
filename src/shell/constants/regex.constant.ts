export const REGEX_CONSTANTS = {
  EMAIL: new RegExp(/^[a-zA-Z0-9_.]{0,64}@[a-zA-Z0-9.-]{0,63}$/),
  STRONG_PASSWORD: new RegExp(
    /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,20}$/,
  ),
  ENGLISH_STRING: new RegExp(/^((?![^\x00-\x7F]+).)*$/),
  NO_SPACE_STRING: new RegExp(/^[^\s]+$/),
  DOT: new RegExp(/^(?!\.)[^]+(?<!\.)@(?!\.)[^]+(?<!\.)\.[^.]+$/),
};
