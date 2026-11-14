-- Сколько клиент фактически заплатил (со скидкой), в копейках.
-- NULL у заказов, сохранённых до появления поля: для них net = gross,
-- пока синк или вебхук не принесёт amountPaid (см. OrdersService.apply).
ALTER TABLE orders ADD COLUMN amount_paid_kop BIGINT;
