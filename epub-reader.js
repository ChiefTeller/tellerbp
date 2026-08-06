const epubReader = document.querySelector("[data-epub-reader]");

if (epubReader) {
  const bookUrl = epubReader.dataset.bookUrl;
  const storageKey = epubReader.dataset.storageKey || `epub-location:${bookUrl}`;
  const viewer = epubReader.querySelector("[data-epub-viewer]");
  const previousButton = epubReader.querySelector("[data-reader-prev]");
  const nextButton = epubReader.querySelector("[data-reader-next]");
  const status = epubReader.querySelector("[data-reader-status]");
  const resetButton = epubReader.querySelector("[data-reader-reset]");

  const setStatus = (message) => {
    if (status) status.textContent = message;
  };

  if (!window.ePub) {
    setStatus("קורא ה-EPUB לא נטען. נסה לרענן את העמוד.");
  } else {
    const readerSize = () => ({
      width: Math.max(320, viewer.clientWidth || 320),
      height: Math.max(360, viewer.clientHeight || 520)
    });
    const initialSize = readerSize();
    const book = ePub(bookUrl);
    const rendition = book.renderTo(viewer, {
      width: initialSize.width,
      height: initialSize.height,
      flow: "paginated",
      spread: "none",
      manager: "default",
      direction: "rtl"
    });
    rendition.direction("rtl");

    rendition.themes.default({
      body: {
        direction: "rtl",
        "text-align": "right",
        "font-family": '"Segoe UI", Arial, sans-serif',
        "line-height": "1.85"
      },
      p: {
        direction: "rtl",
        "text-align": "right"
      },
      img: {
        "max-width": "100%"
      }
    });

    let currentTarget;
    let readerPageIndex = 0;

    function getSavedState() {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return null;

      try {
        return JSON.parse(saved);
      } catch (error) {
        return { target: saved, page: 0 };
      }
    }

    function getPageMetrics() {
      const view = viewer.querySelector(".epub-view");
      const pageWidth = viewer.querySelector(".epub-container")?.clientWidth || viewer.clientWidth;
      const contentWidth = view?.getBoundingClientRect().width || pageWidth;
      const maxPage = Math.max(0, Math.ceil(contentWidth / pageWidth) - 1);

      return { view, pageWidth, maxPage };
    }

    function getTargetPage(target) {
      const id = target?.includes("#") ? decodeURIComponent(target.split("#").pop()) : "";
      if (!id) return null;

      const iframe = viewer.querySelector("iframe");
      const targetElement = iframe?.contentDocument?.getElementById(id);
      if (!targetElement) return null;

      const { pageWidth, maxPage } = getPageMetrics();
      if (!pageWidth) return null;

      const targetRect = targetElement.getBoundingClientRect();
      const columnIndex = Math.max(0, Math.min(maxPage, Math.floor(targetRect.left / pageWidth)));
      return maxPage - columnIndex;
    }

    function saveLocation(location = rendition.currentLocation()) {
      const cfi = location?.start?.cfi || "";
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          target: currentTarget || cfi,
          page: readerPageIndex
        })
      );
    }

    function applyReaderPage(page = readerPageIndex) {
      const { view, pageWidth, maxPage } = getPageMetrics();
      if (!view || !pageWidth) return;

      readerPageIndex = Math.max(0, Math.min(page, maxPage));
      const rtlPageIndex = maxPage - readerPageIndex;
      view.style.transition = "transform 220ms ease";
      view.style.transform = `translateX(${-rtlPageIndex * pageWidth}px)`;

      saveLocation();
      setStatus(`עמוד ${readerPageIndex + 1} מתוך ${maxPage + 1}. המיקום נשמר בדפדפן הזה.`);
    }

    function turnReaderPage(direction) {
      const { maxPage } = getPageMetrics();
      const nextPage = Math.max(0, Math.min(readerPageIndex + direction, maxPage));
      applyReaderPage(nextPage);
    }

    function displayBook(target, page = 0) {
      currentTarget = target || "";
      readerPageIndex = page;
      rendition
        .display(target)
        .then(() => {
          window.setTimeout(() => {
            const targetPage = page || getTargetPage(target) || 0;
            applyReaderPage(targetPage);
          }, 120);
        })
        .catch(() => {
          setStatus("לא ניתן לטעון את המיקום המבוקש. נסה לבחור פרק אחר.");
        });

      window.setTimeout(() => {
        if (status?.textContent?.includes("טוען")) {
          applyReaderPage(readerPageIndex);
        }
      }, 1800);
    }

    const savedState = getSavedState();
    displayBook(savedState?.target || undefined, savedState?.page || 0);

    rendition.on("relocated", (location) => {
      saveLocation(location);
    });

    rendition.on("rendered", () => {
      window.setTimeout(() => applyReaderPage(readerPageIndex), 90);
    });

    previousButton?.addEventListener("click", () => {
      turnReaderPage(-1);
    });
    nextButton?.addEventListener("click", () => {
      turnReaderPage(1);
    });

    resetButton?.addEventListener("click", () => {
      localStorage.removeItem(storageKey);
      displayBook(undefined, 0);
      setStatus("הקריאה התחילה מחדש");
    });

    document.addEventListener("keydown", (event) => {
      if (event.target.closest("input, select, textarea, button")) return;
      if (event.key === "ArrowRight") turnReaderPage(-1);
      if (event.key === "ArrowLeft") turnReaderPage(1);
    });

    window.addEventListener("resize", () => {
      const size = readerSize();
      rendition.resize(size.width, size.height);
      window.setTimeout(() => applyReaderPage(readerPageIndex), 120);
    });
  }
}
