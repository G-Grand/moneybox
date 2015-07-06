-module(moneybox_en).
-compile(export_all).
-include_lib("n2o/include/wf.hrl").

translate(A) -> wf:to_list(A).


