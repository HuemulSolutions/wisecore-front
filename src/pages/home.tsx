// import { PlateRichEditor } from '@/components/plate-editor/plate-editor';
import { useTranslation } from 'react-i18next';
import { HuemulPageLayout } from '@/huemul/components/huemul-page-layout';

export default function Home() {
  const { t } = useTranslation('home');
    new Promise<void>((resolve) => setTimeout(resolve, 1500));

  return (
    <HuemulPageLayout
      showHeader={false}
      columns={[
        {
          content: (
            <div className="flex flex-col items-center justify-center min-h-full p-4 md:p-6">
              <h1 className="text-4xl font-bold mb-4">{t('hero.title')}</h1>
              <p className="text-lg text-gray-700 max-w-2xl text-center mb-8">
                {t('hero.description')}
              </p>

              {/* Plate Editor */}
              {/* <div className="w-full max-w-5xl mb-8">
                <PlateRichEditor />
              </div> */}

              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full mb-4">
                <li className="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center border border-gray-100 hover:shadow-lg transition">
                  <span className="text-blue-600 text-2xl mb-2">📄</span>
                  <h2 className="font-semibold text-lg mb-1">{t('features.automatedDocs.title')}</h2>
                  <p className="text-gray-600">{t('features.automatedDocs.description')}</p>
                </li>
                <li className="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center border border-gray-100 hover:shadow-lg transition">
                  <span className="text-pink-600 text-2xl mb-2">🔍</span>
                    <h2 className="font-semibold text-lg mb-1">{t('features.intelligentSearch.title')}</h2>
                    <p className="text-gray-600">{t('features.intelligentSearch.description')}</p>
                </li>
                <li className="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center border border-gray-100 hover:shadow-lg transition">
                  <span className="text-purple-600 text-2xl mb-2">🤝</span>
                  <h2 className="font-semibold text-lg mb-1">{t('features.teamCollaboration.title')}</h2>
                  <p className="text-gray-600">{t('features.teamCollaboration.description')}</p>
                </li>
                <li className="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center border border-gray-100 hover:shadow-lg transition">
                  <span className="text-yellow-600 text-2xl mb-2">💡</span>
                  <h2 className="font-semibold text-lg mb-1">{t('features.aiInsights.title')}</h2>
                  <p className="text-gray-600">{t('features.aiInsights.description')}</p>
                </li>
              </ul>
            </div>
          ),
        },
      ]}
    />
  );
}