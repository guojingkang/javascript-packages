A Swiss Army Knife to init project/create files/lint/build/test/publish
=================================

**DEPRECATED**

With devsak, there is no need to **manually** install a long list devDependencies in your package, 
such as eslint and shared config, babel family, mocha family etc. 
All you need is just install `devsak` and use it to:
* Init a project with the boilerplate
* Create README.md, .npmignore, .gitignore, LICENSE files
* Clean and lint
* Build you es6 scripts to es5-compatible
* Test your code with es6 support
* Publish

## Installation
Always install the cli globally, and should used only with `npm >= 3`. 

`npm i devsak-cli -g`

## Usage

### Init a project
You should init a project first, to make the project devsak-compatible.
Use `devsak init -b <boilerplate>`.
Currently the boilerplate option only support `node`(which is just a simple project).

### In a project
After init a devsak-compatible project, run `devsak <command>` in your project root directory, 
and fly with the help!

Common commands:
* `devsak create`: create files, like .npmignore, .gitignore, .eslintrc
* `devsak clean`
* `devsak lint`
* `devsak build`: build the source to output dir, and convert the es6 to es5
* `devsak test`
* `devsak publish`: publish to npm or just check or just pack

And you can also add the command to the `scripts` in `package.json`, like:

```
  "prepublish": "devsak test && devsak publish -c"
```

## License

Licensed under MIT

Copyright (c) 2016 [kiliwalk](https://github.com/kiliwalk)

