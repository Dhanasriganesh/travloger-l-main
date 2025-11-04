import React, { useState } from 'react'

interface Blog {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  author: string
  category: string
  tags: string[]
  status: 'Published' | 'Draft' | 'Scheduled'
  featured: boolean
  image: string
  publishDate: string
  views: number
  likes: number
  comments: number
}

interface NewBlog {
  title: string
  excerpt: string
  content: string
  category: string
  tags: string
  featured: boolean
}

type FilterType = 'all' | 'published' | 'draft' | 'scheduled'

const Blogs: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([
    {
      id: 1,
      title: '10 Must-Visit Destinations in Bali',
      slug: '10-must-visit-destinations-bali',
      excerpt: 'Discover the most beautiful places to visit in Bali, from stunning beaches to ancient temples.',
      content: 'Full blog content here...',
      author: 'Sarah Wilson',
      category: 'Destinations',
      tags: ['Bali', 'Travel Tips', 'Destinations'],
      status: 'Published',
      featured: true,
      image: '/api/placeholder/400/300',
      publishDate: '2024-01-15',
      views: 1250,
      likes: 45,
      comments: 12
    },
    {
      id: 2,
      title: 'Complete Guide to European Travel',
      slug: 'complete-guide-european-travel',
      excerpt: 'Everything you need to know before planning your European adventure.',
      content: 'Full blog content here...',
      author: 'Mike Johnson',
      category: 'Travel Tips',
      tags: ['Europe', 'Travel Guide', 'Planning'],
      status: 'Published',
      featured: false,
      image: '/api/placeholder/400/300',
      publishDate: '2024-01-12',
      views: 890,
      likes: 32,
      comments: 8
    },
    {
      id: 3,
      title: 'Thailand Street Food Guide',
      slug: 'thailand-street-food-guide',
      excerpt: 'Explore the vibrant street food scene in Bangkok and beyond.',
      content: 'Full blog content here...',
      author: 'Lisa Davis',
      category: 'Food & Culture',
      tags: ['Thailand', 'Food', 'Culture'],
      status: 'Published',
      featured: true,
      image: '/api/placeholder/400/300',
      publishDate: '2024-01-10',
      views: 2100,
      likes: 78,
      comments: 23
    },
    {
      id: 4,
      title: 'Japan Cherry Blossom Season',
      slug: 'japan-cherry-blossom-season',
      excerpt: 'The ultimate guide to experiencing cherry blossom season in Japan.',
      content: 'Full blog content here...',
      author: 'David Brown',
      category: 'Destinations',
      tags: ['Japan', 'Cherry Blossoms', 'Spring'],
      status: 'Draft',
      featured: false,
      image: '/api/placeholder/400/300',
      publishDate: '2024-01-20',
      views: 0,
      likes: 0,
      comments: 0
    }
  ])

  const [showModal, setShowModal] = useState<boolean>(false)
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
  const [newBlog, setNewBlog] = useState<NewBlog>({
    title: '',
    excerpt: '',
    content: '',
    category: 'Travel Tips',
    tags: '',
    featured: false
  })

  const filteredBlogs = blogs.filter(blog => {
    if (filter === 'all') return true
    return blog.status.toLowerCase() === filter.toLowerCase()
  })

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Published': return 'bg-primary/10 text-primary'
      case 'Draft': return 'bg-yellow-100 text-yellow-800'
      case 'Scheduled': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const openBlogDetails = (blog: Blog): void => {
    setSelectedBlog(blog)
    setShowModal(true)
  }

  const handleCreateBlog = (): void => {
    const nextId = (blogs[blogs.length - 1]?.id || 0) + 1
    const created: Blog = {
      id: nextId,
      title: newBlog.title || 'Untitled',
      slug: newBlog.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      excerpt: newBlog.excerpt || '',
      content: newBlog.content || '',
      author: 'Current User',
      category: newBlog.category || 'Travel Tips',
      tags: newBlog.tags ? newBlog.tags.split(',').map(tag => tag.trim()) : [],
      status: 'Draft',
      featured: newBlog.featured,
      image: '/api/placeholder/400/300',
      publishDate: new Date().toISOString().slice(0, 10),
      views: 0,
      likes: 0,
      comments: 0
    }
    setBlogs([created, ...blogs])
    setShowCreateModal(false)
    setNewBlog({ title: '', excerpt: '', content: '', category: 'Travel Tips', tags: '', featured: false })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
          <p className="text-gray-600">Create and manage your travel blog content</p>
        </div>
        <button
          className="bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
          onClick={() => setShowCreateModal(true)}
        >
          Create New Blog
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">📝</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Blogs</dt>
                  <dd className="text-lg font-medium text-gray-900">{blogs.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">✓</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Published</dt>
                  <dd className="text-lg font-medium text-gray-900">{blogs.filter(b => b.status === 'Published').length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">📄</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Drafts</dt>
                  <dd className="text-lg font-medium text-gray-900">{blogs.filter(b => b.status === 'Draft').length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">👁</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Views</dt>
                  <dd className="text-lg font-medium text-gray-900">{blogs.reduce((sum, blog) => sum + blog.views, 0)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({blogs.length})
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'published' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Published ({blogs.filter(b => b.status === 'Published').length})
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'draft' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Drafts ({blogs.filter(b => b.status === 'Draft').length})
          </button>
          <button
            onClick={() => setFilter('scheduled')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'scheduled' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Scheduled ({blogs.filter(b => b.status === 'Scheduled').length})
          </button>
        </div>
      </div>

      {/* Blogs Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredBlogs.map((blog) => (
          <div key={blog.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">Blog Image</span>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(blog.status)}`}>
                  {blog.status}
                </span>
                {blog.featured && (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Featured
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{blog.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{blog.excerpt}</p>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{blog.author}</span>
                <span>{blog.publishDate}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>👁 {blog.views}</span>
                <span>❤️ {blog.likes}</span>
                <span>💬 {blog.comments}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => openBlogDetails(blog)}
                  className="flex-1 bg-primary text-white px-3 py-2 rounded text-sm hover:opacity-90"
                >
                  View
                </button>
                <button className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-300">
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Blog Details Modal */}
      {showModal && selectedBlog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Blog Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <p className="text-sm text-gray-900">{selectedBlog.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Author</label>
                  <p className="text-sm text-gray-900">{selectedBlog.author}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="text-sm text-gray-900">{selectedBlog.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tags</label>
                  <p className="text-sm text-gray-900">{selectedBlog.tags.join(', ')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Excerpt</label>
                  <p className="text-sm text-gray-900">{selectedBlog.excerpt}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stats</label>
                  <p className="text-sm text-gray-900">Views: {selectedBlog.views} • Likes: {selectedBlog.likes} • Comments: {selectedBlog.comments}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-90">
                  Edit Blog
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Blog Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Blog</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newBlog.title}
                    onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Blog title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newBlog.category}
                    onChange={(e) => setNewBlog({ ...newBlog, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Travel Tips">Travel Tips</option>
                    <option value="Destinations">Destinations</option>
                    <option value="Food & Culture">Food & Culture</option>
                    <option value="Adventure">Adventure</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={newBlog.tags}
                    onChange={(e) => setNewBlog({ ...newBlog, tags: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="travel, tips, guide"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                  <textarea
                    rows={3}
                    value={newBlog.excerpt}
                    onChange={(e) => setNewBlog({ ...newBlog, excerpt: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Brief description of the blog"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    rows={6}
                    value={newBlog.content}
                    onChange={(e) => setNewBlog({ ...newBlog, content: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Full blog content"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newBlog.featured}
                    onChange={(e) => setNewBlog({ ...newBlog, featured: e.target.checked })}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700">Featured Blog</label>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBlog}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-90"
                >
                  Create Blog
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Blogs
