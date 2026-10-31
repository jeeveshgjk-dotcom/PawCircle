import React, { useState } from 'react';
import { AlertCircle, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

export function MigrationBanner() {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const copyPath = () => {
    navigator.clipboard.writeText('supabase/migrations/20261031000000_initial_schema.sql');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 shadow-sm text-yellow-900">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">Supabase Tables Not Found Yet</div>
          <p className="text-xs text-yellow-800 mt-1 leading-relaxed">
            Your Supabase connection is active, but the database tables have not been created yet in your Supabase project.
          </p>

          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-xs font-semibold text-yellow-700 hover:text-yellow-900 flex items-center gap-1"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Hide setup instructions' : 'How to run the 1-minute setup'}
          </button>

          {expanded && (
            <div className="mt-3 pt-3 border-t border-yellow-200 text-xs text-yellow-800 space-y-2">
              <ol className="list-decimal ml-4 space-y-1">
                <li>Log in to your <strong>Supabase Dashboard</strong> (<a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="underline font-medium">supabase.com/dashboard</a>).</li>
                <li>Select project <strong>jkdmpqmrgtbwuozrbuaf</strong>.</li>
                <li>Click <strong>SQL Editor</strong> in the left sidebar, then click <strong>New Query</strong>.</li>
                <li>Copy the SQL script from:
                  <div className="mt-1 flex items-center gap-2 bg-white/80 p-1.5 rounded-lg border border-yellow-200 font-mono text-[11px]">
                    <span className="truncate flex-1">supabase/migrations/20261031000000_initial_schema.sql</span>
                    <button
                      onClick={copyPath}
                      className="px-2 py-0.5 bg-yellow-100 hover:bg-yellow-200 rounded text-yellow-800 flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </li>
                <li>Paste the script into the SQL Editor and click <strong>Run</strong>.</li>
                <li>Refresh this page. Your database and storage will be completely ready!</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

