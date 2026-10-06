# pi-unescape

Automatic decoding has been retired. Literal Unicode escapes can be file names,
search expressions, code examples or quoted evidence. A tool name cannot tell
whether a string should be decoded, so this extension no longer changes tool
arguments or conversation history.

Existing npm installations remain loadable and register no hooks. The exported
`unescapeText` and `unescapeValue` helpers remain available for explicit use by
callers that know the input is escaped prose.

```sh
pi install npm:@prjct.app/pi-unescape
```

License: [MIT](LICENSE).
