import axios from 'axios';
import { pipe } from 'fp-ts/lib/function';
import TE from 'fp-ts/lib/TaskEither';
import { tryCatch as TE_tryCatch, map as TE_map } from 'fp-ts/lib/TaskEither';
import fs from 'fs';
import path from 'path';

function cfnGetSheetData(
  api_key: string,
  sheet_id: string,
): TE.TaskEither<Error, string[][]> {
  const url = `${process.env.GOOGLE_SHEET_API_ENDPOINT}/${sheet_id}/values/lang?key=${api_key}`;

  return TE_tryCatch(
    () =>
      axios.get(url).then((response) => {
        const values = response.data.values;

        if (!values) {
          throw new Error('No data found.');
        }

        return values;
      }),
    (reason) => new Error(String(reason)),
  );
}

function pfnCreateTranslationObject(arr: string[][]): Record<string, string> {
  const translation_obj = {};

  for (let i = 1; i < arr.length; i++) {
    const lang = arr[0][i];
    if (!lang) break;
    translation_obj[lang] = {};

    for (let j = 1; j < arr.length; j++) {
      const key = arr[j][0];
      const translation = arr[j][i];
      translation_obj[lang][key] = translation;
    }
  }

  return translation_obj;
}

function cnfWriteI18nFile(trans_obj: Record<string, string>): Promise<void> {
  for (const to in trans_obj) {
    fs.writeFile(
      path.join(__dirname, `../i18n/${to}/trans.json`),
      JSON.stringify(trans_obj[to]),
      'utf8',
      (err) => {
        if (err) console.log(err);
        else {
          console.log('File written successfully');
        }
      },
    );
  }

  return;
}

export async function cfnSetI18nFile(): Promise<void> {
  pipe(
    cfnGetSheetData(
      process.env.GOOGLE_SHEET_TOKEN,
      process.env.GOOGLE_SHEET_ID,
    ),
    TE_map((res) => pfnCreateTranslationObject(res)),
    TE_map((res) => cnfWriteI18nFile(res)),
  )();
}
