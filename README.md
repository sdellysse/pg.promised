# pg.promisied: A Promise wrapper for `pg`.

Wraps around a `pg` or `pg.native` instance and converts it to use Promises for
asynchronous flow control instead of callbacks.

# Quickstart:
```javascript
// pg.promised works with either `pg` or `pg-native`
const pg = require("pg.promised")(require("pg-native"));

// Always make sure to call done() when finished with the connection, as per
// pg's docs.
function something1 () {
    return pg.connect("postgres://...")
    .then(({ client, done }) => {
        return client.query("SELECT * FROM foo")
        .then(result => {
            done();
            console.log(result);
        })
        ;
    })
    ;
}

// As that gets tedious, a small wrapper function `using()` has been added to
// the pg object. The following function is functionally-equivalent to the
// above:
function something2 () {
    return pg.using("postgres://...", client => client.query("SELECT * FROM foo"))
    .then(result => console.log(result))
    ;
}
```

# Documentation:

## wrap (default function exported)

    wrap(pg: (pg|pg-native), ?PromiseImpl: (Promise|Bluebird|...)): pg.promised

First argument is required and should be either `require("pg")` or
`require("pg-native")`. Second argument is optional, it is the Promise
implementation to be used. If this argument is null or undefined it will default
to `global.Promise`.

Example:
```javascript
// To Use default global.Promise
const pg = require("pg.promised")(require("pg"));

// To Use Bluebird
const pg = require("pg.promised")(require("pg"), require("bluebird"));
```

## pg.promised

All methods an properties are inherited from the `pg` object given to `wrap`.
The following changes have been made:

## pg.promised .connect

    pg.connect(...args): Promise<[ pg.promised.Client, done() ]>

`.connect` returns a promise instead of accepting a callback as it's final
argument. All arguments to `.connect` are proxied to the `pg` object received by
`wrap`. Consult node-postgres for more information on those specifics. It
returns a Promise that resolves to a two-item object, a `pg.promised.Client`
instance and a `done` function. As per the node-postgres docs, you must call
`done()` as soon as you're done with the connection for it to go back into the
pool.


Example:
```javascript
pg.connect("postgres://...")
.then(([ client, done ]) => {
    return client.query("SELECT * FROM foo")
    .then(results => {
        done();
        return results;
    })
    ;
})
.then(results => console.log(results.rows))
.catch(e => console.error(e))
;
```

## pg.promised .using

    pg.using(...args, cb: (Function<client: pg.promised.Client>: Promise)): Promise<(cb's return value)>

`.using` is a small helper that takes in everything a `.connect` call would but
also accepts a final object, a callback that returns a promise. This callback
receives the `client` instance and once the Promise returned by the callback
resolves `done()` will automatically be called for that `client`. The Promise
returned by `cb` will be returned from `run`.

Example:
```javascript
pg.run("postgres://...", client => client.query("SELECT * FROM foo"))
.then(results => console.log(results.rows))
.catch(e => console.error(e))
;
```

## pg.promised.Client

This is a Promised-wrapped class equivalend to the Client class of the pg
object passed to `wrap`. All methods and properties have been inherited from
that class, any differences are marked in this section:


## pg.promised.Client .query

    client.query(...args): Promise<results>

`.query` accepts all arguments given to the original `client.query` but wraps
the value returned in a Promise. Note that this means that you'll need to use
a different function recevie an event emitter from this function, if you care to
do so.

## pg.promised.Client .queryEmitter

    client.query(...args): [node-postgres's result emitter]

No Promise-wrapping here, but it is needed since the original `pg` or
`pg-native` modules have a Client object whose `query` method will return a
specialized event emitter if the callback is omitted. Since the wrapped version
of `query` removes this functionality, this brings it back.

# Compared to pg-promise

`pg.promised` is much lower-level than `pg-promise`. `pg.promised` is simply the
smallest set of changes needed to have the excellent `node-postgres` library use
Promises for flow control instead of callbacks. `pg-promise` is very
full-featured and adds a lot to `node-postgres` but I wanted something much
simpler.
