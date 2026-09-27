module.exports = function (api) {
  api.cache(true);

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            // Must come before "@": maps @/assets/* -> assets/*
            // (mirrors tsconfig paths).
            "^@/assets/(.+)": "./assets/\\1",
            "@": "./src",
          },
        },
      ],
    ],
  };
};
