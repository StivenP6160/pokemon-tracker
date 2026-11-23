-- Archivo generado con: npm run seed:export (2026-11-23)
-- Decks iniciales tomados de Limitless. No lo edites a mano:
-- corre npm run meta:sync y luego npm run seed:export.

INSERT INTO decks (name, icons, limitless_id) VALUES
  ('Alakazam Dudunsparce', ARRAY['alakazam', 'dudunsparce'], 'alakazam-dudunsparce'),
  ('Alakazam Dusknoir', ARRAY['alakazam', 'dusknoir'], 'alakazam-dusknoir'),
  ('Basic Box', ARRAY['kangaskhan-mega', 'clefairy'], 'basic-box-m'),
  ('Ceruledge', ARRAY['ceruledge'], 'ceruledge-ex'),
  ('Cinccino', ARRAY['cinccino'], 'cinccino-ex'),
  ('Crustle', ARRAY['crustle'], 'crustle-dri'),
  ('Cynthia''s Garchomp', ARRAY['garchomp'], 'cynthia-garchomp-ex'),
  ('Dhelmise', ARRAY['dhelmise', 'banette'], 'dhelmise-pbl'),
  ('Dragapult', ARRAY['dragapult'], 'dragapult-ex'),
  ('Dragapult Blaziken', ARRAY['dragapult', 'blaziken'], 'dragapult-blaziken'),
  ('Dragapult Dudunsparce', ARRAY['dragapult', 'dudunsparce'], 'dragapult-dudunsparce'),
  ('Ethan''s Typhlosion', ARRAY['typhlosion'], 'ethan-typhlosion'),
  ('Festival Lead', ARRAY['dipplin', 'thwackey'], 'festival-lead'),
  ('Greninja', ARRAY['greninja'], 'greninja-ex'),
  ('Igglybuff', ARRAY['igglybuff'], 'igglybuff-30c'),
  ('Lopunny Dudunsparce', ARRAY['lopunny-mega', 'dudunsparce'], 'lopunny-dudunsparce'),
  ('Manectric Eelektrik', ARRAY['manectric-mega', 'eelektrik'], 'manectric-eelektrik'),
  ('Mega Charizard Y', ARRAY['charizard-mega-y'], 'mega-charizard-y-ex'),
  ('Mega Excadrill', ARRAY['excadrill-mega'], 'mega-excadrill-ex'),
  ('Mega Golisopod', ARRAY['golisopod-mega'], 'mega-golisopod-ex'),
  ('Mega Lucario', ARRAY['lucario-mega'], 'mega-lucario-ex'),
  ('Mega Rayquaza', ARRAY['rayquaza-mega'], 'mega-rayquaza-ex'),
  ('Mega Starmie', ARRAY['starmie-mega'], 'mega-starmie-ex'),
  ('N''s Zoroark', ARRAY['zoroark'], 'n-zoroark'),
  ('Ogerpon Meganium Hydrapple', ARRAY['ogerpon', 'hydrapple'], 'ogerpon-meganium-hydrapple'),
  ('Other', ARRAY['substitute'], 'other'),
  ('Rocket''s Honchkrow', ARRAY['honchkrow', 'porygon2'], 'rockets-honchkrow'),
  ('Rocket''s Mewtwo', ARRAY['mewtwo', 'spidops'], 'rocket-mewtwo-ex'),
  ('Sharpedo Toxtricity', ARRAY['sharpedo-mega', 'toxtricity'], 'sharpedo-toxtricity'),
  ('Slowking', ARRAY['slowking'], 'slowking-scr'),
  ('Talonflame Dusknoir', ARRAY['talonflame', 'dusknoir'], 'talonflame-dusknoir'),
  ('Toucannon', ARRAY['toucannon'], 'toucannon-pbl')
ON CONFLICT DO NOTHING;
