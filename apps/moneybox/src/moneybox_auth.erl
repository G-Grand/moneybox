-module(moneybox_auth).
-author('Maxim Sokhatsky').
-description('PrivatBank Promin Session Authentication').
-include("moneybox.hrl").
-compile(export_all).

source()            -> source(?CTX).
source(CTX=#cx{})   -> source(wf:qc(<<"from">>,CTX));
source(<<"p24">>)   -> p24;
source(<<"front">>) -> front;
source(<<"dev">>)   -> dev;
source(undefined)   -> site;
source(_)           -> cheater.

ensure_session()             -> ensure_session(wf:session(<<"session">>)).              % получение сессии
ensure_session(_=#moneybox_session{}) -> skip;                                                   % если она существует, то ничего не делаем
ensure_session(_)            -> wf:session(<<"session">>,#moneybox_session{}).                   % если сессия не существует, то создаём пустую

restore_session(DepositsSID, SourceSID, Source) when DepositsSID /= SourceSID , DepositsSID /= undefined ->
    n2o_session:session_sid([], ?CTX, DepositsSID, Source),
    n2o_session:new_cookie_value(DepositsSID,Source);
restore_session(_DepositsSID, SourceSID, Source) ->
    n2o_session:session_sid([], ?CTX, SourceSID, Source).

auth() -> DepositsSID = wf:qc(<<"csid">>),                                              % sid, который пришел из Приват24
          wf:info(?MODULE,"CSID from path: ~p ~n",[DepositsSID]),
          Source      = source(),
          SourceSID   = wf:cookie_req(n2o_session:session_cookie_name(Source), ?REQ),   % sid, который записан в cookie
          restore_session(DepositsSID, SourceSID, Source),
          ensure_session(),                                                             % проверка сессии и, если её нет, создание новой
          auth(Source, SourceSID, DepositsSID).                                         % получаем данные клиента (если это необходимо)

auth(front,_SourceSID,DepositsSID)-> front_cache(wf:cache(DepositsSID));                % если в cookie сида не было, то получаем клиента, использую ЕКБ ИД и телефон из кеша
auth(p24,undefined,DepositsSID)   -> p24_cache (wf:cache (DepositsSID));                % если в cookie сида не было, то получаем клиента, использую ЕКБ ИД и телефон из кеша
auth(p24,SourceSID,DepositsSID)   -> p24_ses   (SourceSID,DepositsSID);                 % если в cookie сид есть, то сначала проверяем наличие клиента в сессии, а потом уже получим его из ЕКБ
auth(_,  SourceSID,DepositsSID)   -> site_ses  (SourceSID,DepositsSID).

front_cache(undefined) ->
    wf:info(?MODULE,"AUTH-front: rejected because cache data is empty.~n",[]),
    wf:session(<<"session">>, ?SES#moneybox_session{channel = {error, bad_cache}});
front_cache([{ldap,Ldap},{sid,ESASid},{page,_Page},{ekbid,EKB},{bank,_Bank},{locale,_Locale},{timings,_Timings}]) ->
    IsTrueManager = front_endpoint:getManagerLogin(ESASid,?REQ),
    io:format("==================== is true Manager: ~p ===================",[IsTrueManager]),
    AuthCookie = wf:cookie_req("frontAuth",?REQ),
    Manager = getManagerInfo(Ldap,ESASid),
    DepositsSID = wf:qc(<<"csid">>),
    PromSid = act:service(auth, openSession, []),                                        % получаем SID проминя
    Client  = act:service(ekb,  getClientFromEkbWithBLByEkbId, [PromSid, EKB, ru]),      % получаем из ЕКБ данные клиента
    wf:info(?MODULE,"AUTH: authCookie: ~p.~n", [AuthCookie]),
    wf:info(?MODULE,"AUTH: Client ~p just authenticated from ESA.~n", [Client#client.phone]),
    wf:info(?MODULE,"AUTH: Manager ~p .~n", [Manager]),
    case {Manager#manager.ldap_login,AuthCookie} of
        {undefined,_} ->
            wf:info(?MODULE,"AUTH-front: rejected because manager data is BAD.~n",[]),
            deposits_error:error(?MODULE,?LINE,service,{error, bad_manager_data}),
            wf:session(<<"session">>, ?SES#moneybox_session{channel = {error, bad_manager_data}});
        {_,undefined} ->
            wf:info(?MODULE,"AUTH-front: rejected because auth cookie is Empty.~n",[]),
            deposits_error:error(?MODULE,?LINE,service,{error, no_auth_cookie}),
            wf:session(<<"session">>, ?SES#moneybox_session{channel = {error, no_auth_cookie}});
        {_,_} when AuthCookie /= DepositsSID ->
            wf:info(?MODULE,"AUTH-front: rejected because auth cookie is diffrent from csid.~n",[]),
            deposits_error:error(?MODULE,?LINE,service,{error, bad_auth_cookie}),
            wf:session(<<"session">>, ?SES#moneybox_session{channel = {error, bad_auth_cookie}});
        {_,_} ->
            wf:session(<<"session">>, ?SES#moneybox_session {
                current_client = Client,
                channel   = front,
                phone     = Client#client.phone,
                sid       = #sid{sid= PromSid},
                current_form = undefined,
                auth_from = alreadyAuth }) end;
front_cache(_) ->
    wf:info(?MODULE,"AUTH-front: ESA auth failed.~n",[]),
    wf:session(<<"session">>, ?SES#moneybox_session{channel = {error, esa_auth_error}}).

p24_cache(undefined) ->                                                                 % если из кеша не достали ЕКБ ИД и телефон, то значит DepositsSID пришел неверный
    wf:info(?MODULE,"AUTH: rejected because SourceSID/JS and DepositsSID/URL are empty.~n",[]),
    wf:session(<<"session">>, ?SES#moneybox_session{channel = {error, bad_cache}});
p24_cache([{ekbid,EKB},{phone,PHONE}]) ->                                               % если из кеша по DepositsSID получили ЕКБ ИД и телефон, то...
    PromSid = act:service(auth, openSession, []),                                       % получаем SID проминя
    Client  = act:service(ekb,  getClientFromEkbWithBLByEkbId, [PromSid, EKB, ru]),     % получаем из ЕКБ данные клиента
    wf:info(?MODULE,"AUTH: Client ~p just authenticated from PROMIN.~n", [PHONE]),
    wf:session(<<"session">>, ?SES#moneybox_session {                                            % записываем всё в сессию
        current_client = Client,
        manager   = undefined,
        channel   = p24,
        phone     = Client#client.phone,
        sid       = #sid{ sid = PromSid },
        auth_from = alreadyAuth }).

p24_ses(_SourceSID,DepositsSID) ->
    case ?SES#moneybox_session.current_client of
         #client{phone=Phone} when Phone /= undefined ->                                % если клиент в сессии уже есть, то ничего не надо делать
              wf:info(?MODULE,"AUTH: Client ~p is already authenticated.~n",[Phone]);
         _ -> p24_cache(wf:cache(DepositsSID)) end.                                     % если нет - по DepositsSID достаём из кеша ЕКБ ИД и телефон и по ним получаем клиента

site_ses(_SourceSID,_DepositsSID) ->
    wf:info(?MODULE,"AUTH: Client will be authenticated later.~n",[]),
    wf:session(<<"session">>, ?SES#moneybox_session{channel = site}).

getManagerInfo(<<"dev">>,<<"dev">>) ->
    #manager{
        ldap_login = <<"dev">>,
%%         auth_branch="DNH0",
    auth_branch="DNIS",
        fio = <<"Тестовый Тестировщик Тестович"/utf8>>,
        peop_posit = <<"Первый тестировщик на районе"/utf8>>,
        peop_sms = <<"+0123456789">>};
getManagerInfo(Ldap,ESASid) ->
    case act:service(manager,getAllManagerInfoBySidLdap,[ESASid,Ldap]) of
        {error, _Reason} -> #manager{ldap_login=undefined};
        DataList ->
            #manager{
                ldap_login= proplists:get_value(manager_ldap,DataList),
                auth_branch= proplists:get_value("brnm",DataList),
                auth_browser= proplists:get_value("browser.type",DataList),
                auth_system= proplists:get_value("device.type",DataList),
                ekb_id= proplists:get_value("CLIENT_ID",DataList),
                bank= proplists:get_value("bank",DataList),
                fio= proplists:get_value("fio",DataList),
                eca_brnmd= proplists:get_value("ECA_BRNMD",DataList),
                eca_brnm= proplists:get_value("ECA_BRNM",DataList),
                is_front= proplists:get_value("IS_FRONT",DataList),
                depar_flmn= proplists:get_value("DEPAR_FLMN",DataList),
                peop_databorn= proplists:get_value("PEOP_DataBorn",DataList),
                peop_sms = proplists:get_value("PEOP_SMS",DataList),
                peop_posit = proplists:get_value("PEOP_Posit",DataList)} end.
