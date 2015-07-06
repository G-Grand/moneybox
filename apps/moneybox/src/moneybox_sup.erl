-module(moneybox_sup).
-behaviour(supervisor).
-export([start_link/0, init/1]).
-compile(export_all).
-include_lib ("n2o/include/wf.hrl").
-include_lib ("dbs/include/cashback.hrl").

banner() ->"  P48 MONEYBOX      N2O v."++ wf:version() ++ "~n".

start_link() -> supervisor:start_link({local, ?MODULE}, ?MODULE, []).

init([]) ->

    wf:info(?MODULE,"~nMoneybox WebSocket Server~n" ++ banner(),[]),

    {ok, _} = cowboy:start_http(http, 100, [{port, wf:config(n2o,port,8877)}],
                                           [{env, [{dispatch, dispatch_rules()}]}]),

    kvs:join(),

    {ok, {{one_for_one, 5, 10}, []}}.

mime() -> [{mimetypes,cow_mimetypes,all}].

dispatch_rules() ->
    cowboy_router:compile(
        [{'_', [
            {"/static/[...]", n2o_dynalo, {dir, "apps/moneybox/priv/static", mime()}},
            {"/n2o/[...]", n2o_dynalo, {dir, "deps/n2o/priv", mime()}},
            {"/ws/[...]", bullet_handler, [{handler, n2o_bullet}]},
            {"/common/p24/[...]", p24_endpoint, []},
            {"/common/front/[...]", front_endpoint, []},
            {"/service/[...]", service_endpoint, []},
            {"/deposits/[...]", deposits_rest, []},
            {"/termination/[...]", termination_endpoint, []},
            {"/sender/[...]", sender_endpoint, []},
            {'_', n2o_cowboy, []}
    ]}]).
