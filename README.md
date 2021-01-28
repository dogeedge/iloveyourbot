# Vanity Hunter

Nodejs based tool to generate and hunt vanity ethereum addresses

# Features!

  - Generate multiple addresses
  - Supports Multi-core processors
  - Vanity contract address
  - Log to file
  - Checksum based vanity address
  - Hunting for accounts with any balance

### Installation
```sh
$ git clone https://github.com/iloveyourbot/VanityHunter.git
$ cd VanityHunter
$ npm install
$ node . -i 51a7ab0be9
```
### Examples

Generate ethereum address:
```sh
$ node .
```

Generate 10 ethereum addresses:
```sh
$ node . -n 10
```

Generate 10 ethereum addresses with `51a7ab0be9` as starting characters:
```sh
$ node . -n 10 -i 51a7ab0be9
```

Generate 10 ethereum addresses with `51A7AB0BE9` as the checksum address (case sensitive):
```sh
$ node . -n 10 -i 51A7AB0BE9 -c
```

Generate ethereum address with vanity contract address:
```sh
$ node . -i 51a7ab0be9 --contract
```

Log to file
```sh
$ node . -n 10 -l
```

Help me
```sh
$ node . -h
```

License
----

MIT

