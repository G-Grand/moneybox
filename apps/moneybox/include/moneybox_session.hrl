-ifndef(MONEYBOX_SESSION_HRL).
-define(MONEYBOX_SESSION_HRL, "client_session").
-define(SES, (moneybox:check_expiring())).

-include_lib("act/include/client.hrl").
-include_lib("act/include/client_cards.hrl").
-include_lib("forms/include/step_wizard.hrl").
-include_lib("kvs/include/kvs.hrl").

-record(moneybox_session, {
    atom,
    currency_start,                 %% Валюта депозита (или на открытии или на просмотре) <<"980">>
    bpe_pid,                        %% пид БП
    sid,                            %% рекорд сида проминя #sid{}
    current_client = #client{},     %% #client{}
    client_cards = #client_cards{}, %% #client_cards{}
    current_client_account,         %% #account{}
    phone,                          %% (binary) хранит телефон клиента
    is_resident,                    %% сейчас не используется. (noResident) устанавливается в случае когда клиент не резидент
    error_code,                     %% возвращает ошибку в form_internal_error
    auth_from = undefined,          %% (alreadyAuth) хранит значение авторизирован ли пользователь
    channel,                        %% (p24, front, site) внешний канал
    current_form,                   %% текущая открытая форма в БП, используется для отображения формы при перезагрузки страницы
    manager,
    operation                       %% (open, charge, withdraw, transfer ...) текущая операция
}).

-endif.
