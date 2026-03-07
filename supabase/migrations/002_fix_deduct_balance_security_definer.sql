CREATE OR REPLACE FUNCTION public.deduct_balance(
  p_user_id       UUID,
  p_amount        BIGINT,
  p_generation_id UUID,
  p_description   TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance BIGINT;
BEGIN
  SELECT balance INTO v_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  UPDATE public.profiles
  SET balance = balance - p_amount
  WHERE id = p_user_id;

  INSERT INTO public.transactions (
    user_id, type, status, amount_kopecks,
    balance_before, balance_after,
    description, generation_id
  ) VALUES (
    p_user_id, 'deduction', 'completed', p_amount,
    v_balance, v_balance - p_amount,
    p_description, p_generation_id
  );

  RETURN TRUE;
END;
$$;

-- Разрешить вызов аутентифицированным пользователям
GRANT EXECUTE ON FUNCTION public.deduct_balance(UUID, BIGINT, UUID, TEXT) TO authenticated;
