import Cookies from 'js-cookie';
import { Check, FileText, GanttChartIcon, Globe, LogOut } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { useRecoilState } from 'recoil';
import { UserIcon } from '~/components/svg';
import { useLocalize } from '~/hooks';
import { useAuthContext } from '~/hooks/AuthContext';
import store from '~/store';
import MyKnowledgeView from '../Chat/Input/Files/MyKnowledgeView';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '../ui';
import Settings from './Settings';

function AccountSettings() {
  const localize = useLocalize();
  const [langcode, setLangcode] = useRecoilState(store.lang);
  const changeLang = useCallback(
    (value: string) => {
      let userLang = value;
      if (value === 'auto') {
        userLang = navigator.language || navigator.languages[0];
      }

      requestAnimationFrame(() => {
        document.documentElement.lang = userLang;
      });
      setLangcode(userLang);
      Cookies.set('lang', userLang, { expires: 365 });
    },
    [setLangcode],
  );

  const { user, logout } = useAuthContext();
  const [showSettings, setShowSettings] = useState(false);
  const [showKnowledge, setShowKnowledge] = useRecoilState(store.showKnowledge);

  const name = user?.avatar ?? user?.username ?? '';

  return (
    <div className='mt-4 pt-4 border-t border-gray-300'>
      <button
        className="flex items-center gap-2 cursor-pointer rounded-lg px-3 py-2 mb-3 text-sm transition-all duration-200 ease-in-out border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 w-full"
        onClick={() => {
          window.location.href = "/" + __APP_ENV__.BISHENG_HOST;
        }}
        style={{
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        }}
      >
        <GanttChartIcon className="icon-md" />
        <div className="text-text-primary whitespace-nowrap font-medium">
          {localize('com_nav_admin_panel')}
        </div>
      </button>
      <div 
        className='flex h-auto w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm bg-white/50 backdrop-blur-sm'
        style={{
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="h-8 w-8 flex-shrink-0 cursor-pointer">
              <div className="relative flex">
                {name.length === 0 ? (
                  <div
                    style={{
                      backgroundColor: 'rgb(121, 137, 255)',
                      width: '32px',
                      height: '32px',
                      boxShadow: 'rgba(240, 246, 252, 0.1) 0px 0px 0px 1px',
                    }}
                    className="relative flex items-center justify-center rounded-full p-1 text-text-primary"
                    aria-hidden="true"
                  >
                    <UserIcon />
                  </div>
                ) : (
                  <div className="w-8 h-8 min-w-6 text-white bg-primary rounded-full flex justify-center items-center text-xs">{(user?.name ?? user?.username ?? localize('com_nav_user')).substring(0, 2).toUpperCase()}</div>
                  // <img
                  //   className="rounded-full"
                  //   src={(user?.avatar ?? '') || avatarSrc}
                  //   alt={`${name}'s avatar`}
                  // />
                )}
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-60 rounded-2xl'>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className='select-item text-sm font-normal'>
                <Globe className="icon-md" />
                {localize('com_nav_language')}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className='w-40 rounded-2xl'>
                <span className='text-xs text-gray-400 pl-2'>{localize('com_nav_language_label')}</span>
                <DropdownMenuItem className='font-normal justify-between' onClick={() => changeLang('zh-Hans')}>
                  {localize('com_nav_lang_chinese')}
                  {langcode === 'zh-Hans' && <Check size={16} />}
                </DropdownMenuItem>
                <DropdownMenuItem className='font-normal justify-between' onClick={() => changeLang('en-US')}>
                  {localize('com_nav_lang_english')}
                  {langcode === 'en-US' && <Check size={16} />}
                </DropdownMenuItem>
                <DropdownMenuItem className='font-normal justify-between' onClick={() => changeLang('ja')}>
                  {localize('com_nav_lang_japanese')}
                  {langcode === 'ja' && <Check size={16} />}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem className='select-item text-sm font-normal'>
              <div className='w-full flex gap-2 items-center' onClick={logout} >
                <LogOut className="icon-md" />
                {localize('com_nav_log_out')}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          className="flex items-center gap-2 cursor-pointer rounded-lg px-3 py-2 transition-all duration-200 ease-in-out border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100"
          onClick={() => setShowKnowledge(true)}
          style={{
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          }}
        >
          <FileText className="icon-md" />
          <div className="text-text-primary whitespace-nowrap font-medium">
            {localize('com_nav_personal_knowledge')}
          </div>
        </button>
      </div>
      {/* {showFiles && <FilesView open={showFiles} onOpenChange={setShowFiles} />} */}
      {showKnowledge && <MyKnowledgeView open={showKnowledge} onOpenChange={setShowKnowledge} />}
      {showSettings && <Settings open={showSettings} onOpenChange={setShowSettings} />}
    </div>
  );
}

export default memo(AccountSettings);
