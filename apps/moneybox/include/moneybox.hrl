-ifndef(MONEYBOX_HRL).
-define(MONEYBOX_HRL, "moneybox_hrl").

-include_lib("n2o/include/wf.hrl").
-include_lib("moneybox_session.hrl").
-include_lib("forms/include/step_wizard.hrl").
-include_lib("dbs/include/card.hrl").
-include_lib("act/include/phone.hrl").
-include_lib("act/include/otp.hrl").
-include_lib("kvs/include/user.hrl").
-include_lib("bpe/include/bpe.hrl").
-include_lib("dbs/include/account.hrl").
-include_lib("act/include/client.hrl").
-include_lib("act/include/manager.hrl").
-include_lib("act/include/client_cards.hrl").
-include_lib("act/include/card_filter.hrl").
-include_lib("act/include/payment.hrl").
-include_lib("act/include/sid.hrl").

-define(GEN_SERVER, [init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

-endif.
