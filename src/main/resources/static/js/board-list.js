let currentPage = 1;
let pageCount = 0;
const pagesToShow = 10;

document.addEventListener('DOMContentLoaded', function () {
    const boardIdInput = document.getElementById('boardId');

    // 게시판 목록 가져오기
    fetch('/api/boards')
        .then(handleResponse)
        .then(data => {
            const boardList = document.getElementById('board-list');
            data.forEach(board => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = `#`;
                a.textContent = board.name;
                a.addEventListener('click', function (event) {
                    event.preventDefault();
                    boardIdInput.value = board.boardId; // 현재 게시판 업데이트
                    updateBoardContent(board.boardId);
                });
                li.appendChild(a);
                boardList.appendChild(li);
            });
        })
        .catch(error => handleError(error, '게시판 목록을 가져오는 중에 문제가 발생했습니다.'));

    // 초기 로딩 시 데이터 가져오기
    updateBoardContent(boardIdInput.value);

    document.getElementById('search-form').addEventListener('submit', function (event) {
        event.preventDefault();
        performSearch(boardIdInput.value);
    });
});

function performSearch(boardId, page = 1) {
    const formData = new FormData(document.getElementById('search-form'));
    const searchCategory = formData.get('searchCategory');
    const searchKeyword = formData.get('searchKeyword');
    let searchParams = `boardId=${boardId}&page=${page}`;

    if (searchCategory === 'title') {
        searchParams += `&title=${searchKeyword}`;
    } else if (searchCategory === 'content') {
        searchParams += `&content=${searchKeyword}`;
    } else if (searchCategory === 'title-content') {
        searchParams += `&title=${searchKeyword}&content=${searchKeyword}`;
    } else if (searchCategory === 'nickname') {
        searchParams += `&nickname=${searchKeyword}`;
    }

    fetch(`/api/posts/search?${searchParams}`)
        .then(response => {
            if (response.status === 204) {
                displayNoPostsMessage('검색 결과가 없습니다.');
                return null;
            }
            return handleResponse(response);
        })
        .then(data => {
            if (data) {
                displayPosts(data.posts); // 게시물 목록 표시
                pageCount = data.totalPages; // 총 페이지 수 설정
                displayPagination(true);
            }
        })
        .catch(error => handleError(error, '게시물을 검색하는 중에 문제가 발생했습니다.'));
}

function updateBoardContent(boardId) {
    fetchPopularPosts(boardId);
    fetchRecentPosts(boardId);
    updatePagination(boardId);
    fetchNotices();
}

function fetchNotices() {
    fetch('/api/boards/notices')
        .then(handleResponse)
        .then(data => {
            const noticeList = document.getElementById('notice-list');
            noticeList.innerHTML = '';
            data.forEach(notice => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <h4>${notice.title}</h4>
                    <p>${notice.content}</p>
                    <span>작성일: ${notice.createdAt}</span>`;
                noticeList.appendChild(li);
            });
        })
        .catch(error => handleError(error, '공지사항을 가져오는 중에 문제가 발생했습니다.'));
}

function fetchPopularPosts(boardId) {
    fetch(`/api/posts/hot/${boardId}`)
        .then(response => {
            if (response.status === 204) {
                displayNoPopularPostsMessage('주간 인기글이 없습니다.');
                return null;
            }
            return handleResponse(response);
        })
        .then(data => {
            if (data) {
                const popularPosts = document.getElementById('popular-posts');
                popularPosts.innerHTML = `
                    <h4>${data.title}</h4>
                    <p>${data.content}</p>
                    <img src="https://placehold.co/30x30" alt="Placeholder Image">
                    <p>작성일: ${data.createdAt}</p>
                    <p>조회수: ${data.viewCount}</p>
                    <p>좋아요: ${data.likes}</p>
                    <p>댓글 수: ${data.commentsCount}</p>
                    <p>작성자: ${data.nickname}</p>`;
            }
        })
        .catch(error => handleError(error, '인기 게시물을 가져오는 중에 문제가 발생했습니다.'));
}

function fetchRecentPosts(boardId, page = 1) {
    fetch(`/api/boards/posts?boardId=${boardId}&page=${page}`)
        .then(response => {
            if (response.status === 204) {
                displayNoPostsMessage('게시판이 비어 있습니다.');
                return null;
            }
            return handleResponse(response);
        })
        .then(data => {
            if (data) {
                displayPosts(data);
            }
        })
        .catch(error => handleError(error, '게시물 목록을 가져오는 중에 문제가 발생했습니다.'));
}

function updatePagination(boardId) {
    fetch(`/api/boards/${boardId}/pagescount`)
        .then(handleResponse)
        .then(count => {
            pageCount = count;
            displayPagination(false);
        })
        .catch(error => handleError(error, '페이지 수를 가져오는 중에 문제가 발생했습니다.'));
}

function displayPagination(searchMode) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    if (pageCount > pagesToShow && currentPage > 10) {
        const prevButton = document.createElement('a');
        prevButton.href = `#`;
        prevButton.textContent = '이전';
        prevButton.addEventListener('click', function (event) {
            event.preventDefault();
            currentPage -= pagesToShow;
            if (currentPage < 1) {
                currentPage = 1;
            }
            searchMode ? performSearch(document.getElementById('boardId').value, currentPage) : fetchRecentPosts(document.getElementById('boardId').value, currentPage);
            displayPagination(searchMode);
        });
        pagination.appendChild(prevButton);
    }

    const startPage = Math.floor((currentPage - 1) / pagesToShow) * pagesToShow + 1;
    const endPage = Math.min(startPage + pagesToShow - 1, pageCount);

    for (let i = startPage; i <= endPage; i++) {
        const a = document.createElement('a');
        a.href = `#`;
        a.textContent = i;
        a.className = i === currentPage ? 'active' : '';
        a.addEventListener('click', function (event) {
            event.preventDefault();
            currentPage = i;
            searchMode ? performSearch(document.getElementById('boardId').value, currentPage) : fetchRecentPosts(document.getElementById('boardId').value, currentPage);
            displayPagination(searchMode);
        });
        pagination.appendChild(a);
    }

    if (endPage < pageCount) {
        const nextButton = document.createElement('a');
        nextButton.href = `#`;
        nextButton.textContent = '다음';
        nextButton.addEventListener('click', function (event) {
            event.preventDefault();
            currentPage += pagesToShow;
            if (currentPage > pageCount) {
                currentPage = pageCount;
            }
            searchMode ? performSearch(document.getElementById('boardId').value, currentPage) : fetchRecentPosts(document.getElementById('boardId').value, currentPage);
            displayPagination(searchMode);
        });
        pagination.appendChild(nextButton);
    }
}

function displayPosts(posts) {
    const postList = document.getElementById('post-list');
    postList.innerHTML = '';

    posts.forEach(post => {
        const li = document.createElement('li');
        li.innerHTML = `
            <h4>${post.title}</h4>
            <p>${post.content}</p>
            <img src="https://placehold.co/30x30" alt="Placeholder Image">
            <p>작성일: ${post.createdAt}</p>
            <p>조회수: ${post.viewCount}</p>
            <p>좋아요: ${post.likes}</p>
            <p>댓글 수: ${post.commentsCount}</p>
            <p>작성자: ${post.nickname}</p>`;
        postList.appendChild(li);
    });
}

function displayNoPostsMessage(message) {
    const postList = document.getElementById('post-list');
    postList.innerHTML = `<p>${message}</p>`;
}

function displayNoPopularPostsMessage(message) {
    const popularPosts = document.getElementById('popular-posts');
    popularPosts.innerHTML = `<p>${message}</p>`;
}

function handleResponse(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

function handleError(error, message) {
    console.error(error);
    alert(message);
}