import { useEffect, useState } from 'react';
import { Heart, MessageCircle, Plus, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import UserAvatar from '@/components/UserAvatar';

const GROUPS = ['General', 'Early Recovery', 'Family Support', 'Faith-Based', 'Parenting', 'Financial Freedom', 'Career Development'];

export default function Community() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [groupFilter, setGroupFilter] = useState(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newGroup, setNewGroup] = useState('General');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expandedComments, setExpandedComments] = useState({});
  const [commentTexts, setCommentTexts] = useState({});
  const [authors, setAuthors] = useState({});

  const load = async () => {
    let query = supabase.from('community_posts').select('*').order('created_at', { ascending: false }).limit(50);
    if (groupFilter) query = query.eq('group_name', groupFilter);
    const { data, error: err } = await query;
    if (err) { setError('Could not load posts.'); return; }
    setPosts(data || []);

    const authorIds = [...new Set((data || []).map((p) => p.user_id))];
    if (authorIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, display_name, avatar_emoji, avatar_url').in('id', authorIds);
      const map = {};
      (profiles || []).forEach((p) => { map[p.id] = p; });
      setAuthors(map);
    }
  };

  useEffect(() => { load(); }, [groupFilter]);

  const post = async () => {
    if (!newContent.trim()) return;
    setSaving(true);
    const { error: err } = await supabase.from('community_posts').insert({ content: newContent.trim(), group_name: newGroup });
    setSaving(false);
    if (err) { setError('Could not create post.'); return; }
    setShowNewPost(false);
    setNewContent('');
    load();
  };

  const toggleReaction = async (postId) => {
    const { data: myReactions } = await supabase.from('community_reactions').select('id').eq('post_id', postId).eq('user_id', currentUser.id).eq('reaction', 'heart');
    if (myReactions && myReactions.length > 0) {
      await supabase.from('community_reactions').delete().eq('id', myReactions[0].id);
    } else {
      await supabase.from('community_reactions').insert({ post_id: postId, reaction: 'heart' });
    }
    load();
  };

  const addComment = async (postId) => {
    const text = commentTexts[postId]?.trim();
    if (!text) return;
    await supabase.from('community_comments').insert({ post_id: postId, content: text });
    setCommentTexts((prev) => ({ ...prev, [postId]: '' }));
    loadComments(postId);
  };

  const loadComments = async (postId) => {
    const { data } = await supabase.from('community_comments').select('*').eq('post_id', postId).order('created_at', { ascending: true });
    const { data: reactions } = await supabase.from('community_reactions').select('user_id, reaction').eq('post_id', postId);
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: { comments: data || [], reactions: reactions || [] },
    }));
  };

  const getAuthor = (userId) => authors[userId] || { display_name: 'Student', avatar_emoji: '🎓' };

  return (
    <PageShell
      eyebrow="Community"
      title="Recovery together"
      action={
        <Button onClick={() => setShowNewPost(!showNewPost)} className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">
          {showNewPost ? <X size={16} /> : <Plus size={16} />}
          {showNewPost ? 'Cancel' : 'New post'}
        </Button>
      }
    >
      {error && <div className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-brand-error">{error}</div>}

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setGroupFilter(null)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${!groupFilter ? 'bg-brand-primary text-white' : 'bg-white border border-brand-border text-brand-charcoal hover:bg-brand-card'}`}
        >
          All groups
        </button>
        {GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => setGroupFilter(g)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${groupFilter === g ? 'bg-brand-primary text-white' : 'bg-white border border-brand-border text-brand-charcoal hover:bg-brand-card'}`}
          >
            {g}
          </button>
        ))}
      </div>

      {showNewPost && (
        <div className="mb-6 rounded-2xl border border-brand-border bg-white p-6">
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-brand-dark">Group</label>
            <select
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              className="w-full rounded-xl border border-brand-border bg-brand-base px-4 py-3 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              {GROUPS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={4}
            placeholder="Share what's on your mind, a win, a struggle, or encouragement for others..."
            className="w-full rounded-xl border border-brand-border bg-brand-base px-4 py-3 text-sm text-brand-dark placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <Button onClick={post} disabled={saving || !newContent.trim()} className="mt-3 rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">
            {saving ? 'Posting...' : 'Share post'}
          </Button>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-border bg-white p-12 text-center">
          <Users className="mx-auto mb-4 text-brand-primary" size={40} />
          <p className="font-heading text-xl text-brand-dark">No posts yet</p>
          <p className="mt-2 text-brand-muted">Be the first to share in the {groupFilter || 'community'}.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map((post) => {
            const author = getAuthor(post.user_id);
            const cached = expandedComments[post.id];
            const isExpanded = !!cached;
            const reactionCount = cached?.reactions?.length || 0;
            const myReaction = cached?.reactions?.some((r) => r.user_id === currentUser.id) || false;
            const comments = cached?.comments || [];

            return (
              <article key={post.id} className="rounded-2xl border border-brand-border bg-white p-6">
                <div className="flex items-start gap-3">
                  <UserAvatar user={author} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-brand-dark">{author.display_name}</p>
                      {post.group_name && (
                        <span className="rounded-full bg-brand-card px-2 py-0.5 text-xs text-brand-muted">{post.group_name}</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-brand-charcoal whitespace-pre-wrap">{post.content}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        onClick={() => toggleReaction(post.id)}
                        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors ${myReaction ? 'bg-red-50 text-red-600' : 'bg-brand-card text-brand-muted hover:text-red-500'}`}
                      >
                        <Heart size={13} fill={myReaction ? 'currentColor' : 'none'} /> {reactionCount > 0 ? reactionCount : ''}
                      </button>
                      <button
                        onClick={() => { if (!isExpanded) loadComments(post.id); else setExpandedComments((prev) => { const next = { ...prev }; delete next[post.id]; return next; }); }}
                        className="flex items-center gap-1 rounded-full bg-brand-card px-2.5 py-1 text-xs text-brand-muted hover:text-brand-primary"
                      >
                        <MessageCircle size={13} /> {isExpanded ? 'Hide' : 'Comments'}
                      </button>
                      <span className="text-xs text-brand-muted">{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 space-y-3">
                        {comments.map((c) => {
                          const cAuthor = getAuthor(c.user_id);
                          return (
                            <div key={c.id} className="flex items-start gap-2 rounded-xl bg-brand-card p-3">
                              <UserAvatar user={cAuthor} size="sm" />
                              <div>
                                <p className="text-sm font-medium text-brand-dark">{cAuthor.display_name}</p>
                                <p className="text-sm text-brand-charcoal">{c.content}</p>
                                <p className="mt-1 text-xs text-brand-muted">{new Date(c.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          );
                        })}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commentTexts[post.id] || ''}
                            onChange={(e) => setCommentTexts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') addComment(post.id); }}
                            placeholder="Write a comment..."
                            className="flex-1 rounded-xl border border-brand-border bg-brand-base px-3 py-2 text-sm text-brand-dark placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
                          />
                          <Button onClick={() => addComment(post.id)} size="sm" className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">
                            Reply
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
