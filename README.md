Moneybox OTP Application
========================

Project Structure
-----------------

After retrival of the project with

    $ ./mad deps

You will find following key applicarion in the tree:

    ├── apps/moneybox       -- N2O based application

Quick Start Bootstrap
---------------------

    ./mad deps compile plan repl

Production Start
----------------

Usually we use `make console` to test things if any error.
But normally we start application as

    $ make start

In case of need you can attach to console with

    $ make attach

and quit from there with CTRL+D. Now you may open the Deposit Application
at [http://localhost:8866/static/app/open.htm](http://localhost:8866/static/app/open.htm).

Produce Single-File Binary
--------------------------

To produce single-file binary you can use

    $ ./mad bundle deposits

command. After producing a `deposits` binary just run it with

    $ ./deposits

Server Push
-----------

Now you can request in browser JavaScript console:

    > ws.send(enc(tuple(atom('client'),tuple(atom('start_deposit'),"+380.."))));

In Erlang console:

    deposits_open:Pid: <0.669.0>
    > pid(0,669,0) ! {direct,{line,deposits_otp,line0_0}}.

and web page should be updated.

Credits
-------

* Maxim Sokhatsky
* Dmitriy Krapivnoy
* Igor Levin
* Zatolokin Pavel
* Dmitriy Sirenko
