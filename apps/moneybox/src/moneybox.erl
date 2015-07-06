-module(moneybox).
-description('PrivatBank P48 Moneybox API').
-compile(export_all).
-include("moneybox.hrl").
-include("moneybox_session.hrl").
-include_lib("dbs/include/card.hrl").
-include_lib("act/include/client_cards.hrl").
-include_lib("stdlib/include/ms_transform.hrl").
-include_lib("dbs/include/cashback.hrl").

getBank() -> wf:config(n2o,bank,"PB").

getSid() ->
    SidFromSess = ?SES#moneybox_session.sid,
    ActiveSid = act:checkSession(SidFromSess),
    wf:session(<<"session">>, ?SES#moneybox_session{sid = ActiveSid}),
    ActiveSid.

check_expiring() ->
    case wf:session(<<"session">>) of
        undefined -> expired(moneybox:translate(session_expired)), wf:wire("ws.close();"),
        #moneybox_session{};
        Else -> Else end.

initSession() ->
    case wf:session(<<"session">>) of                           % создание клиентской сессии
        #moneybox_session{} -> skip;                                     % создание клиентской сессии
        _ -> wf:session(<<"session">>,#moneybox_session{})               % создание клиентской сессии
    end.                                                        % создание клиентской сессии

main(A) -> mad_repl:main(A,[]).

event(_) -> ok.

expired(_Message) ->
    wf:wire("closeOpenedForm();").

translate(Code)    -> translate(Code,wf:lang()).
translate(Code,ua) -> moneybox_ua:translate(Code);
translate(Code,ru) -> moneybox_ru:translate(Code);
translate(Code,__) -> moneybox_en:translate(Code).
