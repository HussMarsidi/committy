## [0.4.0](https://github.com/HussMarsidi/committy/compare/v0.3.1...v0.4.0) (2026-06-03)

### Features

* **changelog:** changelog async call from github ([76bae9b](https://github.com/HussMarsidi/committy/commit/76bae9bbb2b44d10e779fb9b03f79175940c02cc))
* **cli:** when user is using greenfield, will pull all tags ([a6e3995](https://github.com/HussMarsidi/committy/commit/a6e3995aca9876c50b4ff1a9adb5acf61179b7ad))
* **package:** add bump scripts ([2c4beaa](https://github.com/HussMarsidi/committy/commit/2c4beaabeaf81457997f01dc5a1f372cdaadef9e))

## [0.3.0](https://github.com/HussMarsidi/committy/compare/v0.3.1...v0.3.0) (2026-06-03)

### Features

* **changelog:** changelog async call from github ([76bae9b](https://github.com/HussMarsidi/committy/commit/76bae9bbb2b44d10e779fb9b03f79175940c02cc))
* **cli:** when user is using greenfield, will pull all tags ([a6e3995](https://github.com/HussMarsidi/committy/commit/a6e3995aca9876c50b4ff1a9adb5acf61179b7ad))
* **package:** add bump scripts ([2c4beaa](https://github.com/HussMarsidi/committy/commit/2c4beaabeaf81457997f01dc5a1f372cdaadef9e))

## [0.3.1](https://github.com/HussMarsidi/committy/compare/v0.2.0...v0.3.1) (2026-06-02)

### Features

* **branch:** add interactive branch name prompt ([31c2a1e](https://github.com/HussMarsidi/committy/commit/31c2a1e2006c6ba6c28915dcbe61df802a525fe0))
* **branch:** compile naming patterns to regex ([54b9a40](https://github.com/HussMarsidi/committy/commit/54b9a40968a5d48d7b7e5d53fd9ff6aa74c3cfd6))
* **branch:** parse gcv branch inline arguments ([79e9318](https://github.com/HussMarsidi/committy/commit/79e931855734ad700b9026b747eaaccf5636e0ef))
* **branch:** validate branch names against config patterns ([43cf91a](https://github.com/HussMarsidi/committy/commit/43cf91ae4aa64039150cbc3aa2c87333cc4d5c7d))
* **bump:** add version detection and git release helpers ([b8b82f2](https://github.com/HussMarsidi/committy/commit/b8b82f2e0e8737fa4a51338640045c9f8b1cbc27))
* **bump:** wire gcv bump command ([0f268b5](https://github.com/HussMarsidi/committy/commit/0f268b51d9374a24f5b099e5d497d22bf5bda379))
* **changelog:** add gcv changelog command ([02015c5](https://github.com/HussMarsidi/committy/commit/02015c583f3aa8d506a8ca116fa9425e7c7a0336))
* **cli:** add gcv branch command ([bccec5d](https://github.com/HussMarsidi/committy/commit/bccec5d272900c4c8a50573d2b89dc5686ee6022))
* **cli:** fetch from tags from remote ([7954ba9](https://github.com/HussMarsidi/committy/commit/7954ba91cff3324dc0d5b21417fd784d7064363d))
* **config:** add branch naming types and defaults ([ff1dc30](https://github.com/HussMarsidi/committy/commit/ff1dc30e428a6f66214545b5ba7466e914207e80))
* **config:** parse optional branches section in loader ([26aaaee](https://github.com/HussMarsidi/committy/commit/26aaaeef3f834a6b635a3ddb92d4d82835bad3a5))
* **git:** add git switch helper for branch creation ([13b4a25](https://github.com/HussMarsidi/committy/commit/13b4a2500e311c2d0c8da6481f11f6143acf120f))
* **hooks:** detect husky and define hook scripts ([ca2733e](https://github.com/HussMarsidi/committy/commit/ca2733ed99694871ba15d61927d6cc16c88b6314))
* **hooks:** install post-checkout branch validation hooks ([8827197](https://github.com/HussMarsidi/committy/commit/882719759e64da9631ecce1541c9531f8b8f95c3))
* **init:** add branch naming prompts to gcv init ([5c680f9](https://github.com/HussMarsidi/committy/commit/5c680f97b05b83db89ff9522f8596f9aff41f1f7))
* **init:** add optional git hook installation to gcv init ([dfc8a63](https://github.com/HussMarsidi/committy/commit/dfc8a637d0c292594cd2822c1e2307db63f82a43))
* **web:** frontend web ([05f0a53](https://github.com/HussMarsidi/committy/commit/05f0a531ed2b855d37c3eb484b25fae7933edba4))
* **web:** update to v2 ([56c06e4](https://github.com/HussMarsidi/committy/commit/56c06e4782021a1bb8842cb4e04b66ae4f70b521))

### Bug Fixes

* **docs:** swap web into docs ([8adce7e](https://github.com/HussMarsidi/committy/commit/8adce7eafe4fe36bff7e1f1fcfbbf33e357c3ffe))
* **package:** update packages ([df2e0bf](https://github.com/HussMarsidi/committy/commit/df2e0bf9a9d1630a2912c0ab51c43c497d2c4e17))

## [0.1.3](https://github.com/HussMarsidi/committy/compare/v0.1.2...v0.1.3) (2026-06-02)

### Features

* **cli:** change scope creation to accept boolean ([0ca162d](https://github.com/HussMarsidi/committy/commit/0ca162d5864ab1ed67635f62a773794395cac8ea))
* **cli:** parse argv, route commands, help, and version ([c64d9e9](https://github.com/HussMarsidi/committy/commit/c64d9e917df45654949fd49063cdc7a246b165cc))
* **commands:** commit and init command flows ([59d36e9](https://github.com/HussMarsidi/committy/commit/59d36e9966a7492c45140e45554cc75f6767fe31))
* **config:** types, defaults, indexes, loader, and validation ([c084e1b](https://github.com/HussMarsidi/committy/commit/c084e1bba9d934445331ef6c011b74fea063dd88))
* **format:** commit message builder and git helpers ([ed0741b](https://github.com/HussMarsidi/committy/commit/ed0741bb07f66ce8da95428dc2ecc7a5636bcd77))
* **parse:** inline arg parsing with 2-arg scope disambiguation ([13fe7d0](https://github.com/HussMarsidi/committy/commit/13fe7d008f96d711e21eb0263100aedc46e581e8))
* **prompt:** interactive commit prompt with locked field fallback ([6f8eb9a](https://github.com/HussMarsidi/committy/commit/6f8eb9a52b3eaf28812143e545bd6533e016dc9a))

### Bug Fixes

* **ci:** add npm registry always auth ([38c52f5](https://github.com/HussMarsidi/committy/commit/38c52f542d26dbe9652721fd0f37c6d767ebafbb))
* **ci:** require build for pnpm to run properly in github ci ([e84c89c](https://github.com/HussMarsidi/committy/commit/e84c89c956252c1cdbb66caf1af0cbc646a93f2b))
* **github:** bump minimum node version ([089b68a](https://github.com/HussMarsidi/committy/commit/089b68a49b54f7ba5ca4949282ade963ef32b15b))
* **init:** require at least one commit type when skipping defaults ([ba7496b](https://github.com/HussMarsidi/committy/commit/ba7496b80b9466f9259fe688316b41e70f538c0c))
* **package:** regress to older package version to follow minimum release age ([f399ac7](https://github.com/HussMarsidi/committy/commit/f399ac7325689176150aa189ab0f0938218f8c76))
