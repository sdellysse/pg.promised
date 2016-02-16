/**
 * Copyright (c) 2016 Shawn Dellysse
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const phinally = require("phinally");

module.exports = function (originalPg, Promise) {
    const pg = Object.create(originalPg);

    pg.connect = function (...args) {
        return new Promise((resolve, reject) => {
            originalPg.connect.call(this, ...args, (err, client, done) => {
                if (err) {
                    return reject(err);
                }

                return resolve({ client, done });
            });
        });
    };

    pg.using = function () {
        const connectArgs = [];
        for (let i = 0, l = (arguments.length - 1); i < l; i++) {
            connectArgs[i] = arguments[i];
        }
        const promiseFactory = arguments[arguments.length - 1];

        return pg.connect(...connectArgs)
        .then(({ client, done }) =>
            Promise.resolve(promiseFactory(client))
            ::phinally(() => done())
        )
        ;
    };

    return pg;
};
