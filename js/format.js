/**
 * Created by wangwy on 15-1-12.
 * 初始化书本等信息
 */
EPUB.Format = function (book) {
  this.book = book;
  this.baseUrl = this.book.bookUrl || '';
  this.bookUrlOptions = EPUB.Utils.parseUrl(this.baseUrl);
};

/**
 * 格式化META-INF/container.xml
 * @param containerXML
 * @returns {{packagePath: string, encoding: string}}
 */
EPUB.Format.prototype.formatContainerXML = function (containerXML) {
  var rootfile, fullpath, encoding;
  rootfile = containerXML.querySelector("rootfile");
  fullpath = rootfile.getAttribute("full-path");
  this.bookUrl = this.baseUrl + EPUB.Utils.parseUrl(fullpath).base;
  encoding = containerXML.xmlEncoding;
  return {
    'packagePath': fullpath,
    'encoding': encoding,
    'bookUrl': this.bookUrl
  }
};

/**
 * 格式化opf文件
 * @param opfFileXML
 * @returns {{metadata: *, manifest: {}, spine: Array}}
 */
EPUB.Format.prototype.formatOpfFile = function (opfFileXML) {
  var that = this;
  var metadataNode, manifestNode, spineNode;
  var metadata, manifest, spine;

  metadataNode = opfFileXML.querySelector("metadata");
  manifestNode = opfFileXML.querySelector("manifest");
  spineNode = opfFileXML.querySelector("spine");

  metadata = this.formatMetadata(metadataNode);
  manifest = this.formatManifest(manifestNode);
  spine = this.formatSpine(spineNode,manifest);
  spine.forEach(function(item){
    that.spineIndex[item.href] = item.index;
  });
  return {
    'metadata': metadata,
    'manifest': manifest,
    'spine': spine
  }
};

/**
 * 格式化书本元数据
 * @param xml
 */
EPUB.Format.prototype.formatMetadata = function (xml) {
  var metadata = {};

  metadata.bookTitle = this.getXMLTextByTag(xml, 'title');
  metadata.creator = this.getXMLTextByTag(xml, 'creator');
  metadata.description = this.getXMLTextByTag(xml, 'description');
  metadata.pubdate = this.getXMLTextByTag(xml, 'pubdate');
  metadata.publisher = this.getXMLTextByTag(xml, 'publisher');
  metadata.identifier = this.getXMLTextByTag(xml, 'identifier');
  metadata.language = this.getXMLTextByTag(xml, 'language');
  metadata.rights = this.getXMLTextByTag(xml, 'rights');

  return metadata;
};

/**
 * 通过标签名获取标签内容
 * @param xml
 * @param tag
 * @returns {string}
 */
EPUB.Format.prototype.getXMLTextByTag = function (xml, tag) {
  var found = xml.getElementsByTagNameNS("http://purl.org/dc/elements/1.1/", tag),
      el;
  if (!found || found.length === 0) return '';
  el = found[0];
  if (el.childNodes.length) {
    return el.childNodes[0].nodeValue;
  }
  return '';
};

/**
 * 格式化书页清单
 * @param xml
 * @returns {{}}
 */
EPUB.Format.prototype.formatManifest = function (xml) {
  var manifest = {}, that = this;

  var selected = xml.querySelectorAll("item"),
      items = Array.prototype.slice.call(selected);

  items.forEach(function (item) {
    var id = item.getAttribute('id'),
        href = item.getAttribute('href') || '',
        type = item.getAttribute('media-type') || '',
        properties = item.getAttribute('properties') || '';

    manifest[id] = {
      'href': href,
      'url': that.bookUrl + href,
      'type': type,
      'properties': properties
    };

    if (item.getAttribute('media-type') == "application/x-dtbncx+xml") {
      that.formatToc(href);
    }
  });

  return manifest;
};

/**
 * 格式化书脊
 * @param xml
 * @returns {Array}
 */
EPUB.Format.prototype.formatSpine = function (spineNode, manifest) {
  var spine = [];
  this.spineIndex = {};
  var selected = spineNode.getElementsByTagName("itemref"),
      items = Array.prototype.slice.call(selected);
  items.forEach(function (item, index) {
    var id = item.getAttribute("idref"),
        properties = item.getAttribute("properties") || '',
        linear = item.getAttribute("linear") || '';
    var vert = {
      'id': id,
      'properties': properties,
      'linear': linear,
      'href': manifest[id].href,
      'url': manifest[id].url,
      'index': index
    };
    spine.push(vert);
  });

  return spine;
};

/**
 * 格式化目录
 * @param path
 */
EPUB.Format.prototype.formatToc = function (path) {
  var that = this,
      url = this.bookUrl + path;
  this.toc = [];
  EPUB.Request.loadFile(url, 'xml').then(function (contents) {
    var navMap = contents.getElementsByTagName("navMap")[0];

    function getTOC(nodes, parent) {
      var list = [];
      var items = Array.prototype.slice.call(nodes);
      items.forEach(function (item) {
        var id = item.getAttribute('id'),
            content = item.getElementsByTagName("content")[0],
            href = content.getAttribute('src'),
            url = that.bookUrl + href,
            navLabel = item.getElementsByTagName("navLabel")[0],
            text = item.getElementsByTagName("navLabel")[0].textContent ? item.getElementsByTagName("navLabel")[0].textContent : "",
            subitems = item.getElementsByTagName("navPoint") || false,
            subs = false,
            childof = (item.parentNode == parent);

        if(!childof) return;

        if(subitems){
          subs = getTOC(subitems, item)
        }

        list.push({
          "id":id,
          "href": href,
          "label": text,
          "url": url,
          "spineNum": parseInt(that.spineIndex[href]),
          "subitems": subs
        });
      });
      return list;
    }
    that.toc = getTOC(navMap.getElementsByTagName("navPoint"), navMap);
    that.book.createToc(that.book.getTOC());
  });
};