import app from './app.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`MVPeople API running on port ${PORT}`);
  console.log(`Vincere domain: ${process.env.VINCERE_DOMAIN}`);
  console.log(`8x8 PBX: ${process.env.EIGHT_BY_EIGHT_PBX_ID}`);
});
