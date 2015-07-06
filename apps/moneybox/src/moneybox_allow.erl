-module(moneybox_allow).
-compile(export_all).

% Put modules here which you want to log.
% Call format:
%                wf:info(?MODULE, "~p",[P])

log_modules() -> [
    n2o_session,
    n2o_nitrogen,
    bpe_proc,
    moneybox_sup,
    moneybox_index,
    moneybox_auth,
    moneybox
] ++ forms().

forms() ->
[

].
