/**
 * Created by wangwy on 15-1-12.
 * 初始化书本等信息
 */
EPUB.Format = function (baseUrl) {
  this.baseUrl = baseUrl || '';
  this.bookUrlOptions = this.formatUrl(this.baseUrl);
};

/**
 * 格式化路径
 * @param url
 * @returns {{protocol: string, host: string, path: string, origin: string, directory: string, base: string, filename: string, extension: string, fragment: string, href: *}}
 */
EPUB.Format.prototype.formatUrl = function (url) {
  var uri = {
        protocol: '',
        host: '',
        path: '',
        origin: '',
        directory: '',
        base: '',
        filename: '',
        extension: '',
        fragment: '',
        href: url
      },
      blob = url.indexOf('blob:'),
      doubleSlash = url.indexOf('://'),
      search = url.indexOf('?'),
      fragment = url.indexOf('#'),
      withoutProtocol,
      dot,
      firstSlash;

  if (blob === 0) {
    uri.protocol = "blob";
    uri.base = url.indexOf(0, fragment);
    return uri;
  }

  if (fragment != -1) {
    uri.search = url.slice(fragment + 1);
    uri.href = url.slice(0, fragment);
  }

  if (search != -1) {
    uri.search = url.slice(search + 1);
    uri.href = url.slice(0, search);
  }

  if (doubleSlash != -1) {
    uri.protocol = url.slice(0, doubleSlash);
    withoutProtocol = url.slice(doubleSlash + 3);
    firstSlash = withoutProtocol.indexOf('/');

    if (firstSlash === -1) {
      uri.host = uri.path;
      uri.path = "";
    } else {
      uri.host = withoutProtocol.slice(0, firstSlash);
      uri.path = withoutProtocol.slice(firstSlash);
    }

    uri.origin = uri.protocol + "://" + uri.host +"/";
    uri.directory = this.formatFolder(uri.path);
    uri.base = uri.origin + uri.directory;
  } else {
    uri.path = url;
    uri.directory = this.formatFolder(url);
    uri.base = uri.directory;
  }

  uri.filename = url.replace(uri.base, '');
  dot = uri.filename.lastIndexOf('.');
  if (dot != -1) {
    uri.extension = uri.filename.slice(dot + 1);
  }
  return uri;
};

/**
 * 获取文件
 * @param url
 * @returns {string}
 */
EPUB.Format.prototype.formatFolder = function (url) {
  var lastSlash = url.lastIndexOf('/');
  if (lastSlash == -1) var folder = '';
  folder = url.slice(0, lastSlash + 1);
  return folder;
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
  this.bookUrl = this.baseUrl + this.formatUrl(fullpath).base;
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
  var metadataNode, manifestNode, spineNode;
  var metadata, manifest, spine;

  metadataNode = opfFileXML.querySelector("metadata");
  manifestNode = opfFileXML.querySelector("manifest");
  spineNode = opfFileXML.querySelector("spine");

  metadata = this.formatMetadata(metadataNode);
  manifest = this.formatManifest(manifestNode);
  spine = this.formatSpine(spineNode);

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
    }
  });

  return manifest;
};

/**
 * 格式化书脊
 * @param xml
 * @returns {Array}
 */
EPUB.Format.prototype.formatSpine = function (xml) {
  var spine = [];
  var selected = xml.getElementsByTagName("itemref"),
      items = Array.prototype.slice.call(selected);
  items.forEach(function (item) {
    var id = item.getAttribute("idref"),
        properties = item.getAttribute("properties") || '',
        linear = item.getAttribute("linear") || '';
    var vert = {
      'id': id,
      'properties': properties,
      'linear': linear
    };
    spine.push(vert);
  });

  return spine;
};